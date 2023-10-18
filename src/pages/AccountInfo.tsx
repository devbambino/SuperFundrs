import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
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

const AccountInfo = () => {
    const { loginWeb3Auth, isAuthenticated } = useAccountAbstraction()
    const queryParams = queryString.parse(window.location.search)
    const [orgAddressDetected, setOrgAddressDetected] = useState(queryParams.org ? true : false)
    const [orgAddress, setOrgAddress] = useState(queryParams.org || '')

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
                        {orgAddressDetected ? ('Use your email to Sign In to this organization ' + orgAddress) : ('Please ask your organization for its url or scan its QR code!!!')}
                    </Typography>

                    <Button variant="contained" onClick={loginWeb3Auth} disabled={!orgAddressDetected}>
                        Sign In
                    </Button>
                </ConnectContainer>
            )}

            <Divider style={{ margin: '40px 0 30px 0' }} />

            <Typography variant="h4" component="h2" fontWeight="700" marginBottom="16px">
                Your Organization Info
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
                        Sign in first to see your organization info...
                    </Typography>
                </ConnectContainer>
            )}
        </>
    )
}

export default AccountInfo
