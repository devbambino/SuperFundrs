import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ethers, utils } from 'ethers'
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from '@web3auth/base'
import { Web3AuthOptions } from '@web3auth/modal'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'

import AccountAbstraction from '@safe-global/account-abstraction-kit-poc'
import { Web3AuthModalPack } from '@safe-global/auth-kit'
import { MoneriumPack, StripePack } from '@safe-global/onramp-kit'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'

import { initialChain } from 'src/chains/chains'
import usePolling from 'src/hooks/usePolling'
import Chain from 'src/models/chain'
import getChain from 'src/utils/getChain'
import getMoneriumInfo, { MoneriumInfo } from 'src/utils/getMoneriumInfo'
import isMoneriumRedirect from 'src/utils/isMoneriumRedirect'
import { superFundrsContractAbi, organizationContractAbi } from 'src/utils/contracts-abis'

type accountAbstractionContextValue = {
  ownerAddress?: string
  chainId: string
  safes: string[]
  chain?: Chain
  isAuthenticated: boolean
  web3Provider?: ethers.providers.Web3Provider
  loginWeb3Auth: () => void
  logoutWeb3Auth: () => void
  setChainId: (chainId: string) => void
  safeSelected?: string
  safeBalance?: string
  setSafeSelected: React.Dispatch<React.SetStateAction<string>>
  isRelayerLoading: boolean
  relayTransaction: () => Promise<void>
  gelatoTaskId?: string
  openStripeWidget: () => Promise<void>
  closeStripeWidget: () => Promise<void>
  startMoneriumFlow: () => Promise<void>
  closeMoneriumFlow: () => void
  moneriumInfo?: MoneriumInfo
  getUserOrgs: () => Promise<void>
  setOrg: () => Promise<void>
  joinOrg: () => Promise<void>
  getOrgFromId: () => Promise<void>
  getOrgsCount: () => Promise<void>
  setProposalsAllowed: () => Promise<void>
  getUserBalance: () => Promise<void>
  
}

const initialState = {
  isAuthenticated: false,
  loginWeb3Auth: () => { },
  logoutWeb3Auth: () => { },
  relayTransaction: async () => { },
  setChainId: () => { },
  setSafeSelected: () => { },
  onRampWithStripe: async () => { },
  safes: [],
  chainId: initialChain.id,
  isRelayerLoading: true,
  openStripeWidget: async () => { },
  closeStripeWidget: async () => { },
  startMoneriumFlow: async () => { },
  closeMoneriumFlow: () => { },
  getUserOrgs: async () => { },
  setOrg: async () => { },
  joinOrg: async () => { },
  getOrgFromId: async () => { },
  getOrgsCount: async () => { },
  setProposalsAllowed: async () => { },
  getUserBalance: async () => { },
  
}

const accountAbstractionContext = createContext<accountAbstractionContextValue>(initialState)

const useAccountAbstraction = () => {
  const context = useContext(accountAbstractionContext)

  if (!context) {
    throw new Error('useAccountAbstraction should be used within a AccountAbstraction Provider')
  }

  return context
}

const MONERIUM_TOKEN = 'monerium_token'

const SF_CONTRACT = process.env.REACT_APP_SUPER_FUNDRS_ADDRESS!

const RELAY_KEY = process.env.REACT_APP_GELATO_RELAY_API_KEY!

const AccountAbstractionProvider = ({ children }: { children: JSX.Element }) => {
  // owner address from the email  (provided by web3Auth)
  const [ownerAddress, setOwnerAddress] = useState<string>('')
  const [orgAddress, setOrgAddress] = useState<string>('')

  // safes owned by the user
  const [safes, setSafes] = useState<string[]>([])

  // chain selected
  const [chainId, setChainId] = useState<string>(() => {
    if (isMoneriumRedirect()) {
      return '0x5'
    }

    return initialChain.id
  })

  // web3 provider to perform signatures
  const [web3Provider, setWeb3Provider] = useState<ethers.providers.Web3Provider>()

  const isAuthenticated = !!ownerAddress && !!chainId
  const chain = getChain(chainId) || initialChain

  // reset React state when you switch the chain
  useEffect(() => {
    setOwnerAddress('')
    setSafes([])
    setChainId(chain.id)
    setWeb3Provider(undefined)
    setSafeSelected('')
  }, [chain])

  // authClient
  const [web3AuthModalPack, setWeb3AuthModalPack] = useState<Web3AuthModalPack>()

  // onRampClient
  const [stripePack, setStripePack] = useState<StripePack>()

  useEffect(() => {
    ; (async () => {
      const options: Web3AuthOptions = {
        clientId: process.env.REACT_APP_WEB3AUTH_CLIENT_ID || '',
        web3AuthNetwork: 'testnet',
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: chain.id,
          rpcTarget: chain.rpcUrl
        },
        uiConfig: {
          theme: 'dark',
          loginMethodsOrder: ['google', 'facebook']
        }
      }

      const modalConfig = {
        [WALLET_ADAPTERS.TORUS_EVM]: {
          label: 'torus',
          showOnModal: false
        },
        [WALLET_ADAPTERS.METAMASK]: {
          label: 'metamask',
          showOnDesktop: true,
          showOnMobile: false
        }
      }

      const openloginAdapter = new OpenloginAdapter({
        loginSettings: {
          mfaLevel: 'optional'
        },
        adapterSettings: {
          uxMode: 'popup',
          whiteLabel: {
            name: 'Safe'
          }
        }
      })

      const web3AuthModalPack = new Web3AuthModalPack({
        txServiceUrl: chain.transactionServiceUrl
      })

      await web3AuthModalPack.init({
        options,
        adapters: [openloginAdapter],
        modalConfig
      })

      setWeb3AuthModalPack(web3AuthModalPack)
    })()
  }, [chain])

  // auth-kit implementation
  const loginWeb3Auth = useCallback(async () => {
    if (!web3AuthModalPack) return

    try {
      const { safes, eoa } = await web3AuthModalPack.signIn()
      const provider = web3AuthModalPack.getProvider() as ethers.providers.ExternalProvider

      // we set react state with the provided values: owner (eoa address), chain, safes owned & web3 provider
      setChainId(chain.id)
      setOwnerAddress(eoa)
      setSafes(safes || [])
      setWeb3Provider(new ethers.providers.Web3Provider(provider))
    } catch (error) {
      console.log('error: ', error)
    }
  }, [chain, web3AuthModalPack])

  useEffect(() => {
    if (web3AuthModalPack && web3AuthModalPack.getProvider()) {
      ; (async () => {
        await loginWeb3Auth()
      })()
    }
  }, [web3AuthModalPack, loginWeb3Auth])

  const logoutWeb3Auth = () => {
    web3AuthModalPack?.signOut()
    setOwnerAddress('')
    setSafes([])
    setChainId(chain.id)
    setWeb3Provider(undefined)
    setSafeSelected('')
    setGelatoTaskId(undefined)
    closeMoneriumFlow()
  }

  // current safe selected by the user
  const [safeSelected, setSafeSelected] = useState<string>('')
  const [moneriumInfo, setMoneriumInfo] = useState<MoneriumInfo>()
  const [moneriumPack, setMoneriumPack] = useState<MoneriumPack>()

  // Initialize MoneriumPack
  useEffect(() => {
    ; (async () => {
      if (!web3Provider || !safeSelected) return

      const safeOwner = web3Provider.getSigner()
      const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: safeOwner })

      const safeSdk = await Safe.create({
        ethAdapter: ethAdapter,
        safeAddress: safeSelected,
        isL1SafeMasterCopy: true
      })

      const pack = new MoneriumPack({
        clientId: process.env.REACT_APP_MONERIUM_CLIENT_ID || '',
        environment: 'sandbox'
      })

      await pack.init({
        safeSdk
      })

      setMoneriumPack(pack)
    })()
  }, [web3Provider, safeSelected])

  const startMoneriumFlow = useCallback(
    async (authCode?: string, refreshToken?: string) => {
      if (!moneriumPack) return

      const moneriumClient = await moneriumPack.open({
        redirectUrl: process.env.REACT_APP_MONERIUM_REDIRECT_URL,
        authCode,
        refreshToken
      })

      if (moneriumClient.bearerProfile) {
        localStorage.setItem(MONERIUM_TOKEN, moneriumClient.bearerProfile.refresh_token)

        const authContext = await moneriumClient.getAuthContext()
        const profile = await moneriumClient.getProfile(authContext.defaultProfile)
        const balances = await moneriumClient.getBalances(authContext.defaultProfile)

        setMoneriumInfo(getMoneriumInfo(safeSelected, authContext, profile, balances))
      }
    },
    [moneriumPack, safeSelected]
  )

  const closeMoneriumFlow = useCallback(() => {
    moneriumPack?.close()
    localStorage.removeItem(MONERIUM_TOKEN)
    setMoneriumInfo(undefined)
  }, [moneriumPack])

  useEffect(() => {
    const authCode = new URLSearchParams(window.location.search).get('code') || undefined
    const refreshToken = localStorage.getItem(MONERIUM_TOKEN) || undefined

    if (authCode || refreshToken) startMoneriumFlow(authCode, refreshToken)
  }, [startMoneriumFlow])

  // TODO: add disconnect owner wallet logic ?

  // conterfactual safe Address if its not deployed yet
  useEffect(() => {
    const getSafeAddress = async () => {
      if (web3Provider) {
        const signer = web3Provider.getSigner()
        const relayPack = new GelatoRelayPack()
        const safeAccountAbstraction = new AccountAbstraction(signer)

        await safeAccountAbstraction.init({ relayPack })

        const hasSafes = safes.length > 0

        const safeSelected = hasSafes ? safes[0] : await safeAccountAbstraction.getSafeAddress()

        setSafeSelected(safeSelected)
      }
    }

    getSafeAddress()
  }, [safes, web3Provider])

  const [isRelayerLoading, setIsRelayerLoading] = useState<boolean>(false)
  const [gelatoTaskId, setGelatoTaskId] = useState<string>()

  // refresh the Gelato task id
  useEffect(() => {
    setIsRelayerLoading(false)
    setGelatoTaskId(undefined)
  }, [chainId])

  // relay-kit implementation using Gelato
  const getOrgFromId = async () => {
    if (web3Provider) {
      setIsRelayerLoading(true)

      const signer = web3Provider.getSigner()
      const superFundrs = SF_CONTRACT!
      const abi = superFundrsContractAbi
      const contract = new ethers.Contract(superFundrs, abi, signer)

      try {
        let orgAddress: string = await contract.getOrgFromId('university1.edu');
        setOrgAddress(orgAddress);
        console.log('getOrgFromId:', orgAddress)
      } catch (error) {
        console.log('get error:', error)
      }

      setIsRelayerLoading(false)
    }
  }
  const getUserBalance = async () => {
    if (web3Provider) {
      setIsRelayerLoading(true)

      const signer = web3Provider.getSigner()
      const abi = organizationContractAbi
      console.log('orgAddress',orgAddress)
      const contract = new ethers.Contract(orgAddress, abi, signer)

      try {
        let userBalance: number = await contract.getUserBalance();
        console.log('getUserBalance:', userBalance)
      } catch (error) {
        console.log('get error:', error)
      }

      setIsRelayerLoading(false)
    }
  }
  const getUserOrgs = async () => {
    if (web3Provider) {
      setIsRelayerLoading(true)

      const signer = web3Provider.getSigner()
      const superFundrs = SF_CONTRACT!
      const abi = superFundrsContractAbi
      const contract = new ethers.Contract(superFundrs, abi, signer)

      try {
        let userOrgs: any[] = await contract.getUserOrgs();
        console.log('getUserOrgs:', userOrgs)
      } catch (error) {
        console.log('get error:', error)
      }

      setIsRelayerLoading(false)
    }
  }
  const getOrgsCount = async () => {
    if (web3Provider) {
      setIsRelayerLoading(true)

      const signer = web3Provider.getSigner()
      const superFundrs = SF_CONTRACT!
      const abi = superFundrsContractAbi
      const contract = new ethers.Contract(superFundrs, abi, signer)

      try {
        let orgsCount: number = await contract.getOrgsCount();
        console.log('OrgsCount:', orgsCount)
      } catch (error) {
        console.log('get error:', error)
      }

      setIsRelayerLoading(false)
    }
  }
  const setOrg = async () => {
    if (web3Provider) {
      setIsRelayerLoading(true)

      const signer = web3Provider.getSigner()
      const superFundrs = SF_CONTRACT!
      const abi = superFundrsContractAbi
      const contract = new ethers.Contract(superFundrs, abi, signer)
      const { data } = await contract.populateTransaction.setOrganization('university1.edu', 'Universitu Uno Uno', 'This is the desc for Universitu Uno Uno')
      const transactions: MetaTransactionData[] = [
        {
          to: superFundrs,
          data: data || '0x',
          value: utils.parseUnits('0', 'ether').toString(),
        }
      ]
      const options: MetaTransactionOptions = {
        isSponsored: true,
      }

      const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer })
      const safeSdk = await Safe.create({
        ethAdapter: ethAdapter,
        safeAddress: safeSelected
      })
      const relayKit = new GelatoRelayPack(RELAY_KEY)

      try {
        const safeTransaction = await relayKit.createRelayedTransaction({ safe: safeSdk, transactions, options })
        const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction)
        const response = await relayKit.executeRelayTransaction(signedSafeTransaction, safeSdk, options)
        console.log(response)
        console.log(`Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${response.taskId}`)

      } catch (error) {
        console.log('relay error:', error)
      }

      setIsRelayerLoading(false)
    }
  }
  const setProposalsAllowed = async () => {
    if (web3Provider) {
      if (orgAddress) {
        setIsRelayerLoading(true)

        const signer = web3Provider.getSigner()
        const orgContract = orgAddress
        const abi = organizationContractAbi
        const contract = new ethers.Contract(orgContract, abi, signer)
        const { data } = await contract.populateTransaction.setProposalsAllowed(true)
        const transactions: MetaTransactionData[] = [
          {
            to: orgContract,
            data: data || '0x',
            value: utils.parseUnits('0.2', 'ether').toString(),
          }
        ]
        const options: MetaTransactionOptions = {
          isSponsored: true,
        }

        const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer })
        const safeSdk = await Safe.create({
          ethAdapter: ethAdapter,
          safeAddress: safeSelected
        })
        const relayKit = new GelatoRelayPack(RELAY_KEY)

        try {
          const safeTransaction = await relayKit.createRelayedTransaction({ safe: safeSdk, transactions, options })
          const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction)
          const response = await relayKit.executeRelayTransaction(signedSafeTransaction, safeSdk, options)
          console.log(response)
          console.log(`Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${response.taskId}`)

        } catch (error) {
          console.log('relay error:', error)
        }

        setIsRelayerLoading(false)

      } else {
        console.log('Organization address not setted')
      }

    }
  }
  const joinOrg = async () => {
    if (web3Provider) {
      setIsRelayerLoading(true)

      const signer = web3Provider.getSigner()
      const superFundrs = SF_CONTRACT!
      const abi = superFundrsContractAbi
      const contract = new ethers.Contract(superFundrs, abi, signer)
      const { data } = await contract.populateTransaction.joinOrganization('university1.edu')
      const transactions: MetaTransactionData[] = [
        {
          to: superFundrs,
          data: data || '0x',
          value: utils.parseUnits('0', 'ether').toString(),
        }
      ]
      const options: MetaTransactionOptions = {
        isSponsored: true,
      }

      const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer })
      const safeSdk = await Safe.create({
        ethAdapter: ethAdapter,
        safeAddress: safeSelected
      })
      const relayKit = new GelatoRelayPack(RELAY_KEY)

      try {
        const safeTransaction = await relayKit.createRelayedTransaction({ safe: safeSdk, transactions, options })
        const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction)
        const response = await relayKit.executeRelayTransaction(signedSafeTransaction, safeSdk, options)
        console.log(response)
        console.log(`Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${response.taskId}`)
      } catch (error) {
        console.log('relay error:', error)
      }
      setIsRelayerLoading(false)
    }
  }
  const relayTransaction = async () => {
    if (web3Provider) {
      setIsRelayerLoading(true)

      const signer = web3Provider.getSigner()
      const relayPack = new GelatoRelayPack()
      //console.log('key',process.env.GELATO_RELAY_API_KEY)
      const safeAccountAbstraction = new AccountAbstraction(signer)

      await safeAccountAbstraction.init({ relayPack })

      // we use a dump safe transfer as a demo transaction
      /*const dumpSafeTransafer: MetaTransactionData[] = [
        {
          to: '0x043Aa95C726E4686C7de9848bfB2E689D947b73c',
          data: '0x',
          value: utils.parseUnits('0.0002', 'ether').toString(),
          operation: 0 // OperationType.Call,
        }
      ]

      const options: MetaTransactionOptions = {
        isSponsored: true,
        gasLimit: '600000', // in this alfa version we need to manually set the gas limit
        gasToken: ethers.constants.AddressZero // native token
      }*/
      const superFundrs = SF_CONTRACT
      const abi = superFundrsContractAbi
      const contract = new ethers.Contract(superFundrs, abi, signer)
      const { data } = await contract.populateTransaction.getUserOrgs()
      const dumpSafeTransafer: MetaTransactionData[] = [
        {
          to: superFundrs,
          data: data || '0x',
          value: utils.parseUnits('0', 'ether').toString(),
        }
      ]
      const options: MetaTransactionOptions = {
        isSponsored: false,
      }

      const gelatoTaskId = await safeAccountAbstraction.relayTransaction(dumpSafeTransafer, options)

      setIsRelayerLoading(false)
      setGelatoTaskId(gelatoTaskId)
    }
  }

  // onramp-kit implementation
  const openStripeWidget = async () => {
    const stripePack = new StripePack({
      stripePublicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY || '',
      onRampBackendUrl: process.env.REACT_APP_STRIPE_BACKEND_BASE_URL || ''
    })

    await stripePack.init()

    const sessionData = await stripePack.open({
      // sessionId: sessionId, optional parameter
      element: '#stripe-root',
      defaultOptions: {
        transaction_details: {
          wallet_address: safeSelected,
          supported_destination_networks: ['ethereum', 'polygon'],
          supported_destination_currencies: ['usdc'],
          lock_wallet_address: true
        },
        customer_information: {
          email: 'john@doe.com'
        }
      }
    })

    setStripePack(stripePack)

    console.log('Stripe sessionData: ', sessionData)
  }

  const closeStripeWidget = async () => {
    stripePack?.close()
  }

  // we can pay Gelato tx relayer fees with native token & USDC
  // TODO: ADD native Safe Balance polling
  // TODO: ADD USDC Safe Balance polling

  // fetch safe address balance with polling
  const fetchSafeBalance = useCallback(async () => {
    const balance = await web3Provider?.getBalance(safeSelected)

    return balance?.toString()
  }, [web3Provider, safeSelected])

  const safeBalance = usePolling(fetchSafeBalance)

  const state = {
    ownerAddress,
    chainId,
    chain,
    safes,

    isAuthenticated,

    web3Provider,

    loginWeb3Auth,
    logoutWeb3Auth,

    setChainId,

    safeSelected,
    safeBalance,
    setSafeSelected,

    isRelayerLoading,
    relayTransaction,
    gelatoTaskId,

    openStripeWidget,
    closeStripeWidget,

    startMoneriumFlow,
    closeMoneriumFlow,
    moneriumInfo,

    getUserOrgs,
    setOrg,
    joinOrg,
    getOrgFromId,
    getOrgsCount,
    setProposalsAllowed,
    getUserBalance
  }

  return (
    <accountAbstractionContext.Provider value={state}>
      {children}
    </accountAbstractionContext.Provider>
  )
}

export { useAccountAbstraction, AccountAbstractionProvider }
