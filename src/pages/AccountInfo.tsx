import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import SendIcon from '@mui/icons-material/SendRounded'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Code from 'src/components/code/Code'
import queryString from 'query-string'
import { useEffect, useState } from 'react'

import ConnectedWalletLabel from 'src/components/connected-wallet-label/ConnectedWalletLabel'
import SafeAccount from 'src/components/safe-account/SafeAccount'
import { ConnectContainer, ConnectedContainer } from 'src/components/styles'
import { useAccountAbstraction } from 'src/store/accountAbstractionContext'
import AddressLabel from 'src/components/address-label/AddressLabel'
import { LinearProgress } from '@mui/material'
import GelatoTaskStatusLabel from 'src/components/gelato-task-status-label/GelatoTaskStatusLabel'

const AccountInfo = () => {
    const { chainId,
        chain,

        safeSelected,
        safeBalance,

        isRelayerLoading,
        gelatoTaskId, loginWeb3Auth, isAuthenticated, 
        getUserOrgs ,
        getOrgFromId,
        getOrgsCount,
        getUserBalance
    
    } = useAccountAbstraction()
    const queryParams = queryString.parse(window.location.search)
    const [orgAddressDetected, setOrgAddressDetected] = useState(queryParams.org ? true : false)
    const [orgAddress, setOrgAddress] = useState(queryParams.org || '')
    const [transactionHash, setTransactionHash] = useState<string>('')

    return (
        <>
            <Typography variant="h2" component="h1">
                Welcome to SuperFundrs!!!!
            </Typography>

            <Typography marginTop="16px">
                If you are an organization admin please sign in to SF using an email with the structure sf.admin@organization.edu in order to validate that you have control over the web domain.
            </Typography>

            <Divider style={{ margin: '32px 0 28px 0' }} />

            {/* Auth Demo */}
            <Typography variant="h4" component="h2" fontWeight="700" marginBottom="16px">
                Your account Info
            </Typography>

            {isAuthenticated ? (
                <Box display="flex" gap={3}>
                    {/* safe Account */}
                    <SafeAccount flex={1} />

                    {/* owner ID */}
                    <ConnectedContainer flex={2}>
                        <Typography fontWeight="700">Owner ID</Typography>

                        <Typography fontSize="14px" marginTop="8px" marginBottom="32px">
                            Your Owner account signs transactions to unlock your assets.
                        </Typography>

                        {/* Owner details */}
                        <ConnectedWalletLabel />
                    </ConnectedContainer>
                </Box>


            ) : (
                <ConnectContainer display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <Typography variant="h4" component="h3" fontWeight="700">
                        Use your email to enter SuperFundrs!!!
                    </Typography>

                    <Button variant="contained" onClick={loginWeb3Auth}>
                        Sign In
                    </Button>
                </ConnectContainer>
            )}

            <Divider style={{ margin: '40px 0 30px 0' }} />

            <Typography variant="h4" component="h2" fontWeight="700" marginBottom="16px">
                Your Organization Info
            </Typography>

            {!isAuthenticated ? (
                <ConnectContainer display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <Typography variant="h4" component="h3" fontWeight="700">
                        First use your email to Sign In to an organization
                    </Typography>
                </ConnectContainer>
            ) : (
                <Box display="flex" gap={3}>

                    {/* Relay Transaction */}
                    <ConnectedContainer
                        display="flex"
                        flex={2}
                        flexDirection="column"
                        gap={2}
                        alignItems="flex-start"
                        flexShrink={0}
                    >
                        <Typography fontWeight="700">Relayed transaction</Typography>

                        {isRelayerLoading && <LinearProgress sx={{ alignSelf: 'stretch' }} />}

                        {!isRelayerLoading && (
                            <>
                                <Typography fontSize="14px">
                                    Check the status of your relayed transaction.
                                </Typography>

                                {/* send fake transaction to Gelato relayer */}
                                <Button
                                    startIcon={<SendIcon />}
                                    variant="contained"
                                    onClick={getUserOrgs}
                                >
                                    Get Your Orgs
                                </Button>

                                <Button
                                    startIcon={<SendIcon />}
                                    variant="contained"
                                    onClick={getOrgsCount}
                                >
                                    Get Orgs Count
                                </Button>

                                <Button
                                    startIcon={<SendIcon />}
                                    variant="contained"
                                    onClick={getOrgFromId}
                                >
                                    Get Org From ID
                                </Button>

                                <Button
                                    startIcon={<SendIcon />}
                                    variant="contained"
                                    onClick={getUserBalance}
                                >
                                    Get My Balance
                                </Button>
                            </>
                        )}

                    </ConnectedContainer>
                </Box>
            )}

            
        </>
    )
}

export default AccountInfo
