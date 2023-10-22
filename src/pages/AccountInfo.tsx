import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import SendIcon from '@mui/icons-material/SendRounded'
import TextField from '@mui/material/TextField';
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
import { Alert, Card, CardContent, LinearProgress } from '@mui/material'
import GelatoTaskStatusLabel from 'src/components/gelato-task-status-label/GelatoTaskStatusLabel'
import { utils } from 'ethers';

const AccountInfo = () => {
    const { chainId,
        chain,

        safeSelected,
        safeBalance,

        isRelayerLoading,
        loginWeb3Auth, isAuthenticated,
        getOrgInfoFromId,
        getOrgFromId,
        getOrgsCount,
        getUserBalance,
        setOrg,
        joinOrg,
        setProposalsAllowed,
        getProposalsAllowed,

        newEmail,
        setNewEmail,
        changeUserEmail,
        newDesc, newName, setNewDesc, setNewName,
        isAdmin,
        orgId, orgInfo, areProposalsAllowed

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
                        <Typography fontWeight="700">Your Email</Typography>

                        <Typography fontSize="14px" marginTop="8px" marginBottom="8px">
                            Your email account for signing transactions:
                        </Typography>

                        {/* Owner details */}
                        <ConnectedWalletLabel />
                        <TextField
                            value={newEmail}
                            onChange={(e: any) => setNewEmail(e.target.value)}
                            required
                            id="outlined-required"
                            label="Fake email(For testing)"
                            defaultValue="sf.admin@university1.edu"
                        />
                        <Button variant="contained" onClick={changeUserEmail}>
                            Change Email
                        </Button>
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
                Your Organization ({orgId})
            </Typography>

            {!isAuthenticated ? (
                <ConnectContainer display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <Typography variant="h4" component="h3" fontWeight="700">
                        First use your email to Sign In to an organization
                    </Typography>
                </ConnectContainer>
            ) :
                isAdmin || orgId ? (


                    <Box display="flex" gap={3}>

                        {/* Write Ops */}
                        <ConnectedContainer
                            display="flex"
                            flex={2}
                            flexDirection="column"
                            gap={2}
                            alignItems="flex-start"
                            flexShrink={0}
                        >

                            {isRelayerLoading && <LinearProgress sx={{ alignSelf: 'stretch' }} />}

                            {!isRelayerLoading && (
                                <>
                                    <Stack direction="row" alignItems="center" spacing={2}>

                                        {orgInfo ? (
                                            <Card sx={{ minWidth: 275 }}>
                                                <CardContent>
                                                    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                                        {orgId}
                                                    </Typography>
                                                    <Typography variant="h3" component="div">
                                                        {orgInfo?.name}
                                                    </Typography>
                                                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                                        Proposals allowed? {areProposalsAllowed ? ('Yes') : ('Not yet, please ask the admin to allow them!')}
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {orgInfo?.description}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        ) : (<Typography fontSize="14px">
                                            This organization hasn't been created yet, please ask the Admin to do it, thx...
                                        </Typography>)}

                                        <Box display="grid" gap={2}>
                                            {isAdmin ? !orgInfo ?
                                                        (
                                                            <>
                                                            <TextField
                                                                value={newName}
                                                                onChange={(e: any) => setNewName(e.target.value)}
                                                                required
                                                                id="outlined-required"
                                                                label="Org Name"
                                                            />
                                                            <TextField
                                                                value={newDesc}
                                                                onChange={(e: any) => setNewDesc(e.target.value)}
                                                                required
                                                                id="outlined-required"
                                                                label="Org Description"
                                                            />
                                                            <Button
                                                                variant="contained"
                                                                onClick={setOrg}
                                                            >
                                                                Create Your Organization
                                                            </Button>
                                                            
                                                                {Number(utils.formatEther(safeBalance || '0')) < 0.2 ?
                                                                    (<Alert severity="error">You need to have 0.2 tokens in your balance for allowing proposals and enabling the organization, please get tokens!</Alert>) :
                                                                    (<Alert severity="info">When allowing proposals you are sending 0.2 tokens for enabling the organization!</Alert>)}

                                                                <Button
                                                                    variant="contained"
                                                                    disabled={Number(utils.formatEther(safeBalance || '0')) < 0.2}
                                                                    onClick={setProposalsAllowed}
                                                                >
                                                                    Allow Proposals
                                                                </Button>
                                                            </>
                                                            
                                                        ) :
                                                        ('You have already created the organization, enabled it and allowed the proposals. The account is set and ready to get new users!!!')

                                                       
                                               
                                             : orgInfo ? areProposalsAllowed ? (
                                                <Button
                                                    variant="contained"
                                                    onClick={joinOrg}
                                                >
                                                    Stake tokens & Join
                                                </Button>) : ('The organization does not allow users to join yet, please ask the admin to allow it!!') : ('')


                                            }

                                        </Box>




                                    </Stack>

                                </>
                            )}
                        </ConnectedContainer>

                    </Box>
                ) : (
                    <ConnectContainer display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <Typography variant="h4" component="h3" fontWeight="700">
                            Please, ask the organization for the url or QR code!!!
                        </Typography>
                    </ConnectContainer>
                )

            }


        </>
    )
}

export default AccountInfo
