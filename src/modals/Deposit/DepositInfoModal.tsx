import { Close, Fullscreen, FullscreenExit } from "@mui/icons-material";
import {
  Dialog,
  DialogContent,
  Box,
  Link,
  Typography,
  IconButton,
  TextField,
} from "@mui/material";
import React, { useState, useRef } from "react";

import { CredentialsTag } from "@/components/CredentialsTag";
import { Credentials } from "@/types";

interface DepositInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export const DepositInfoModal: React.FC<DepositInfoModalProps> = ({
  open,
  onClose,
}) => {
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [validatorType, setValidatorType] = useState("0x01");
  const [ethAmount, setEthAmount] = useState(32);
  const [validatorCount, setValidatorCount] = useState(1);
  const [operatingSystem, setOperatingSystem] = useState("Linux");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element && contentRef.current) {
      const headerHeight = 80; // Approximate header height
      const elementTop = element.offsetTop - headerHeight;
      contentRef.current.scrollTo({
        top: elementTop,
        behavior: "smooth",
      });
    }
  };

  const generateCliCommand = () => {
    let command = "./deposit new-mnemonic";

    if (validatorType === "0x01") {
      command += ` --regular-withdrawal --num_validators ${validatorCount}`;
    } else if (validatorType === "0x02") {
      command += ` --compounding --num_validators 1 --amount ${ethAmount}`;
    }

    command += " --chain mainnet";

    if (withdrawalAddress) {
      command += ` --withdrawal_address ${withdrawalAddress}`;
    }

    return command;
  };

  const navigationItems = [
    { id: "introduction", title: "Introduction" },
    { id: "clients", title: "Execution & Consensus Clients" },
    { id: "key-generation", title: "Generating Validator Keys" },
    { id: "gui-option", title: "1. GUI Application" },
    { id: "cli-option", title: "2. Command Line Interface" },
    { id: "source-option", title: "3. Build from Source" },
    { id: "saving-keys", title: "Saving Your Key Files" },
  ];

  const handleClose = () => {
    setIsFullscreen(false);
    onClose();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth={false}
      fullScreen={isFullscreen}
      PaperProps={{
        sx: {
          backgroundColor: "#1E2128",
          borderRadius: isFullscreen ? 0 : 2,
          maxHeight: isFullscreen ? "100vh" : "85vh",
          width: isFullscreen ? "100vw" : "1000px",
          height: isFullscreen ? "100vh" : "auto",
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: "column",
          height: isFullscreen ? "100vh" : "85vh",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 3,
              py: 2,
              borderBottom: "1px solid #404040",
              flexShrink: 0,
            }}
          >
            <Box sx={{ flex: 1 }} />
            <Typography variant="h5" className="font-semibold text-white">
              Validator Creation Guide
            </Typography>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <IconButton
                className="text-secondaryText"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
              <IconButton className="text-secondaryText" onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          {/* Main Content Area */}
          <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
            {/* Left Sidebar Navigation */}
            <Box
              sx={{
                width: "240px",
                borderRight: "1px solid #404040",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ px: 3, py: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {navigationItems.map((item) => {
                    const isSubOption = [
                      "gui-option",
                      "cli-option",
                      "source-option",
                    ].includes(item.id);
                    return (
                      <Typography
                        key={item.id}
                        component="button"
                        onClick={() => scrollToSection(item.id)}
                        sx={{
                          color: "#b3b3b3",
                          "&:hover": {
                            color: "#ffffff",
                            cursor: "pointer",
                          },
                          textTransform: "none",
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          padding: 0,
                          paddingLeft: isSubOption ? 2 : 0,
                          fontSize: "0.875rem",
                          fontFamily: "inherit",
                          transition: "color 0.2s ease",
                        }}
                      >
                        {item.title}
                      </Typography>
                    );
                  })}
                </Box>
              </Box>
            </Box>

            {/* Content */}
            <Box
              ref={contentRef}
              sx={{
                flex: 1,
                px: 4,
                py: 2,
                overflowY: "auto",
                minHeight: 0,
              }}
            >
              {/* Introduction Section */}
              <Box id="introduction" className="mb-12">
                <Typography variant="h4" className="mb-6 font-bold text-white">
                  Introduction to Ethereum Validators
                </Typography>
                <Typography className="mb-4 text-secondaryText">
                  This comprehensive guide will walk you through the entire
                  process of creating and managing Ethereum validators,
                  following the official Ethereum Foundation guidelines.
                </Typography>
                <Typography className="mb-4 text-secondaryText">
                  Validators are essential components of the Ethereum
                  proof-of-stake network. They help secure the blockchain by
                  proposing and validating blocks, and you will earn rewards for
                  participating.
                </Typography>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Validator Types:
                  </Typography>
                  <Box className="mb-3 flex items-center gap-2">
                    <CredentialsTag credentials={Credentials.bls} />
                    <span>BLS Credentials</span>
                  </Box>
                  <Typography className="mb-4 text-secondaryText">
                    These were the original Ethereum validators launched at the
                    start of the Beacon Chain. They do not include an
                    execution-layer withdrawal credential, meaning the initial
                    deposit and rewards can not be withdrawn until the
                    withdrawal credentials are upgraded to a newer format (0x01
                    or 0x02). Because of this limitation, 0x00 validators are
                    considered legacy and are rarely used.
                  </Typography>
                  <Box className="mb-3 flex items-center gap-2">
                    <CredentialsTag credentials={Credentials.execution} />
                    <span>Execution Credentials</span>
                  </Box>
                  <Typography className="mb-4 text-secondaryText">
                    These validators are configured to automatically send
                    staking rewards to the withdrawal address. This means
                    rewards become available but the validator&apos;s effective
                    balance never grows beyond the required 32 ETH. These are
                    often called non-compounding validators, since earnings are
                    withdrawn instead of reinvested.
                  </Typography>
                  <Box className="mb-3 flex items-center gap-2">
                    <CredentialsTag credentials={Credentials.compounding} />
                    <span>Compounding Credentials</span>
                  </Box>
                  <Typography className="text-secondaryText">
                    These validators are configured so that rewards remain with
                    the validator until you choose to withdraw them, either
                    partially or fully. This allows the balance to build up
                    toward the maximum effective balance of 2048 ETH, increasing
                    the validator&apos;s earning potential over time. These are
                    commonly called compounding validators, since rewards
                    accumulate directly within the validator.
                  </Typography>
                </Box>
                <Typography className="text-secondaryText">
                  The sections below will guide you through client setup, key
                  generation, and security best practices.
                </Typography>
              </Box>

              {/* Clients Section */}
              <Box id="clients" className="mb-12">
                <Typography variant="h4" className="mb-6 font-bold text-white">
                  Execution and Consensus Clients
                </Typography>
                <Typography className="mb-4 text-secondaryText">
                  Before generating validator keys, it&apos;s important to
                  understand the two types of clients you will need to run a
                  validator successfully.
                </Typography>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Execution Client:
                  </Typography>
                  <Typography className="mb-2 text-secondaryText">
                    The execution client handles the transaction execution and
                    state management of Ethereum&apos;s execution layer. It is
                    responsible for the Ethereum Virtual Machine (EVM) and user
                    transactions. It processes smart contracts, keeps track of
                    account balances, and applies all state changes. Popular
                    options include Geth, Nethermind, Reth, Besu, and Erigon.
                  </Typography>
                </Box>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Consensus Client:
                  </Typography>
                  <Typography className="mb-2 text-secondaryText">
                    The consensus client handles the coordination and security
                    of Ethereum&apos;s consensus layer. It is responsible for
                    the &quot;proof-of-stake&quot; mechanism in Ethereum,
                    ensuring validators follow the rules: proposing and
                    attesting to blocks, reaching agreement on the head of the
                    chain, and finalizing checkpoints. Options include Prysm,
                    Lighthouse, Teku, Nimbus, and Lodestar.
                  </Typography>
                </Box>
                <Box className="mb-4 rounded-lg border border-green-600 bg-[#1a4d3a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Learn More:
                  </Typography>
                  <Typography className="mb-2 text-secondaryText">
                    For detailed information and comparisons on these clients,
                    see the{" "}
                    <Link
                      href="https://ethereum.org/developers/docs/nodes-and-clients/#consensus-clients"
                      target="_blank"
                    >
                      consensus options
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="https://ethereum.org/developers/docs/nodes-and-clients/#execution-clients"
                      target="_blank"
                    >
                      execution options
                    </Link>{" "}
                    on ethereum.org.
                  </Typography>
                </Box>
                <Typography className="mb-2 text-secondaryText">
                  Both clients must run simultaneously and work together to
                  participate in the Ethereum network as a validator. After
                  client installation, ensure you are fully synced before
                  submitting a staking deposit.
                </Typography>
                <Typography className="text-secondaryText">
                  For more information on how to setup ethereum clients, please
                  view the{" "}
                  <Link
                    href="https://docs.ethstaker.org/tutorials/solo-staking-guides/"
                    target="_blank"
                  >
                    EthStaker Solo Staking Guide
                  </Link>
                  .
                </Typography>
              </Box>

              {/* Key Generation Section */}
              <Box id="key-generation" className="mb-12">
                <Typography variant="h4" className="mb-6 font-bold text-white">
                  Generating Validator Keys
                </Typography>
                <Typography className="mb-4 text-secondaryText">
                  Generating your validator keys is a critical step. These
                  cryptographic keys will control the operations of your
                  validator.
                </Typography>
                <Typography className="mb-4 text-secondaryText">
                  The key generation process creates several important
                  components:
                </Typography>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <ul className="ml-4 space-y-2 text-secondaryText">
                    <li>
                      • <strong className="text-white">Validator Keys:</strong>{" "}
                      BLS signing keys used by validators to sign attestations
                      and blocks proposals
                    </li>
                    <li>
                      •{" "}
                      <strong className="text-white">
                        Withdrawal Credentials:
                      </strong>{" "}
                      Control access to your staked ETH and rewards.
                    </li>
                    <li>
                      • <strong className="text-white">Deposit Data:</strong>{" "}
                      Required for the deposit contract and contains validator
                      public key, withdrawal credentials, signature, and deposit
                      amount.
                    </li>
                    <li>
                      • <strong className="text-white">Mnemonic Phrase:</strong>{" "}
                      BIP-39 mnemonic that deterministically derives both
                      signing and withdrawal keys.
                    </li>
                  </ul>
                </Box>
                <Typography className="mb-2 font-semibold text-white">
                  Key Generation Options:
                </Typography>
                <Typography className="mb-4 text-secondaryText">
                  The following sections will cover three methods for generating
                  your validator keys, each with different security and
                  complexity trade-offs:
                </Typography>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <ol className="ml-4 space-y-2 text-secondaryText">
                    <li>1. GUI Application (Easiest)</li>
                    <li>2. Command Line Interface (Recommended)</li>
                    <li>3. Build from Source (Most Secure)</li>
                  </ol>
                </Box>
                <Typography className="mb-4 text-secondaryText">
                  Choose the method that best fits your technical comfort level
                  and security requirements.
                </Typography>
              </Box>

              {/* GUI Option Section */}
              <Box id="gui-option" className="mb-12">
                <Typography variant="h4" className="mb-6 font-bold text-white">
                  Option 1: GUI Application
                </Typography>
                <Typography className="mb-4 text-secondaryText">
                  The GUI application provides the most user-friendly way to
                  generate validator keys, perfect for those who prefer visual
                  interfaces.
                </Typography>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Wagyu Key Gen:
                  </Typography>
                  <Typography className="mb-2 text-secondaryText">
                    A user-friendly GUI application developed by the Ethereum
                    community for generating validator keys safely.
                  </Typography>
                  <Typography className="mb-2 font-mono text-sm">
                    <Link
                      href="https://github.com/stake-house/wagyu-key-gen"
                      target="_blank"
                    >
                      github.com/stake-house/wagyu-key-gen
                    </Link>
                  </Typography>
                </Box>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Generating Deposit Data:
                  </Typography>
                  <ol className="ml-4 space-y-1 text-secondaryText">
                    <li>
                      1. Download the latest release for your operating system:{" "}
                      <Link
                        href="https://github.com/stake-house/wagyu-key-gen/releases"
                        target="_blank"
                      >
                        https://github.com/stake-house/wagyu-key-gen/releases
                      </Link>
                    </li>
                    <li>2. Verify the downloaded file&apos;s checksum</li>
                    <li>3. Convert the downloaded file to an executable</li>
                    <li>
                      4. Launch the executable from your desktop environment
                    </li>
                    <li>5. Ensure you choose the desired network</li>
                    <li>
                      6. Follow the on-screen prompts to generate keys and
                      deposit data
                    </li>
                  </ol>
                </Box>
                <Box className="mb-4 rounded-lg border border-red-600 bg-[#4a2d2d] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    ⚠️ Security Note:
                  </Typography>
                  <Typography className="text-secondaryText">
                    Always download from official sources and verify checksums.
                    It is recommended to run on an offline computer for maximum
                    security.
                  </Typography>
                </Box>
              </Box>

              {/* CLI Option Section */}
              <Box id="cli-option" className="mb-12">
                <Typography variant="h4" className="mb-6 font-bold text-white">
                  Option 2: Command Line Interface
                </Typography>
                <Typography className="mb-4 text-secondaryText">
                  The CLI method is the recommended approach, offering a good
                  balance of security and usability while being officially
                  maintained by the EthStaker Community.
                </Typography>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    EthStaker Deposit CLI:
                  </Typography>
                  <Typography className="mb-2 text-secondaryText">
                    A maintained fork of the official tool from the Ethereum
                    Foundation for generating validator keys:
                  </Typography>
                  <Typography className="font-mono text-sm">
                    <Link
                      href="https://github.com/ethstaker/ethstaker-deposit-cli"
                      target="_blank"
                    >
                      github.com/ethstaker/ethstaker-deposit-cli
                    </Link>
                  </Typography>
                </Box>
                <Typography className="mb-2 font-semibold text-white">
                  Installation & Usage:
                </Typography>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <ol className="ml-4 space-y-2 text-secondaryText">
                    <li>
                      1. Download the latest release from:{" "}
                      <Link
                        href="https://github.com/ethstaker/ethstaker-deposit-cli/releases/"
                        target="_blank"
                      >
                        https://github.com/ethstaker/ethstaker-deposit-cli/releases/
                      </Link>
                    </li>
                    <li>2. Decompress the file you downloaded</li>
                    <li>
                      3. Navigate to the location of the deposit executable in
                      terminal
                    </li>
                    <li>
                      4. Execute the{" "}
                      <code className="rounded bg-[#171717] px-1 text-white">
                        ./deposit
                      </code>{" "}
                      command following the instructions below
                    </li>
                  </ol>
                </Box>

                <Typography className="mb-4 mt-6 text-lg font-bold text-white">
                  Generate Deposit Keys
                </Typography>

                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Command Options:
                  </Typography>
                  <Typography className="mb-3 text-secondaryText">
                    Choose EITHER regular withdrawal OR compounding (not both):
                  </Typography>
                  <Box className="mb-3 ml-4">
                    <Typography className="mb-2 text-white">
                      <strong>For Regular Withdrawal (0x01):</strong>
                    </Typography>
                    <ul className="ml-4 space-y-1 text-secondaryText">
                      <li>
                        •{" "}
                        <code className="text-white">--regular-withdrawal</code>
                        : Create regular withdrawal validators
                      </li>
                      <li>
                        • <code className="text-white">--num_validators</code>:
                        Number of validators to create (1 or more)
                      </li>
                      <li>
                        •{" "}
                        <em>
                          Note: --amount is omitted (each validator uses exactly
                          32 ETH)
                        </em>
                      </li>
                    </ul>
                  </Box>
                  <Box className="mb-3 ml-4">
                    <Typography className="mb-2 text-white">
                      <strong>For Compounding (0x02):</strong>
                    </Typography>
                    <ul className="ml-4 space-y-1 text-secondaryText">
                      <li>
                        • <code className="text-white">--compounding</code>:
                        Create compounding validators
                      </li>
                      <li>
                        • <code className="text-white">--amount</code>: Amount
                        of ETH to stake (32 to 2048 ETH)
                      </li>
                    </ul>
                  </Box>
                  <Typography className="mb-2 text-white">
                    <strong>Common Options:</strong>
                  </Typography>
                  <ul className="mb-2 ml-4 space-y-1 text-secondaryText">
                    <li>
                      • <code className="text-white">--chain</code>: Network
                      (mainnet, hoodi, etc.)
                    </li>
                    <li>
                      • <code className="text-white">--withdrawal_address</code>
                      : Execution address for withdrawals that you control
                    </li>
                  </ul>
                  <Typography className="text-secondaryText">
                    You can view the full list of command options{" "}
                    <Link
                      href="https://deposit-cli.ethstaker.cc/new_mnemonic.html"
                      target="_blank"
                    >
                      here
                    </Link>
                    .
                  </Typography>
                </Box>

                <Typography className="mb-4 font-semibold text-white">
                  Let&apos;s walk you through constructing the command step by
                  step:
                </Typography>

                {/* Withdrawal Address Input */}
                <Box className="mb-6">
                  <Typography className="mb-3 font-semibold text-white">
                    Step 1: Enter your withdrawal address
                  </Typography>
                  <Typography className="mb-3 text-secondaryText">
                    This is the Ethereum address where your staking rewards and
                    principal will be sent when you withdraw.
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="0x..."
                    value={withdrawalAddress}
                    onChange={(e) => setWithdrawalAddress(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#2a2a2a",
                        "& fieldset": { borderColor: "#404040" },
                        "&:hover fieldset": { borderColor: "#606060" },
                        "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                      },
                      "& .MuiInputBase-input": { color: "white" },
                    }}
                  />
                </Box>

                {/* Validator Type Selection */}
                <Box className="mb-6">
                  <Typography className="mb-3 font-semibold text-white">
                    Step 2: Choose your validator type
                  </Typography>
                  <Box className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Box
                      onClick={() => {
                        setValidatorType("0x01");
                        setValidatorCount(1);
                        setEthAmount(32);
                      }}
                      className={`cursor-pointer rounded-lg border bg-[#2a2a2a] p-4 transition-colors ${
                        validatorType === "0x01"
                          ? "border-blue"
                          : "border-transparent hover:border-blue"
                      }`}
                    >
                      <Typography className="mb-2 font-semibold text-white">
                        0x01 - Regular Withdrawal
                      </Typography>
                      <Typography className="text-sm text-secondaryText">
                        Rewards are automatically sent to your withdrawal
                        address. Validator balance stays at 32 ETH. Good for
                        regular income.
                      </Typography>
                    </Box>
                    <Box
                      onClick={() => {
                        setValidatorType("0x02");
                        setValidatorCount(1);
                        setEthAmount(32);
                      }}
                      className={`cursor-pointer rounded-lg border bg-[#2a2a2a] p-4 transition-colors ${
                        validatorType === "0x02"
                          ? "border-blue"
                          : "border-transparent hover:border-blue"
                      }`}
                    >
                      <Typography className="mb-2 font-semibold text-white">
                        0x02 - Compounding
                      </Typography>
                      <Typography className="text-sm text-secondaryText">
                        Rewards accumulate with the validator, increasing
                        earning potential. Can stake 32-2048 ETH. Better for
                        long-term growth.
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Conditional Inputs */}
                {validatorType === "0x01" && (
                  <Box className="mb-6">
                    <Typography className="mb-3 font-semibold text-white">
                      Step 3: Number of validators
                    </Typography>
                    <Typography className="mb-3 text-secondaryText">
                      Each validator requires exactly 32 ETH. How many
                      validators would you like to create?
                    </Typography>
                    <TextField
                      type="number"
                      value={validatorCount}
                      onChange={(e) =>
                        setValidatorCount(
                          Math.max(1, parseInt(e.target.value) || 1),
                        )
                      }
                      inputProps={{ min: 1 }}
                      sx={{
                        width: "200px",
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#2a2a2a",
                          "& fieldset": { borderColor: "#404040" },
                          "&:hover fieldset": { borderColor: "#606060" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                        "& .MuiInputBase-input": { color: "white" },
                      }}
                    />
                  </Box>
                )}

                {validatorType === "0x02" && (
                  <Box className="mb-6">
                    <Typography className="mb-3 font-semibold text-white">
                      Step 3: ETH amount to stake
                    </Typography>
                    <Typography className="mb-3 text-secondaryText">
                      Enter how much ETH to stake (32 to 2048 ETH):
                    </Typography>
                    <TextField
                      type="number"
                      value={ethAmount}
                      onChange={(e) =>
                        setEthAmount(
                          Math.max(
                            32,
                            Math.min(2048, parseInt(e.target.value) || 32),
                          ),
                        )
                      }
                      inputProps={{ min: 32, max: 2048 }}
                      sx={{
                        width: "200px",
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#2a2a2a",
                          "& fieldset": { borderColor: "#404040" },
                          "&:hover fieldset": { borderColor: "#606060" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                        "& .MuiInputBase-input": { color: "white" },
                      }}
                    />
                    <Typography className="mt-2 text-sm text-secondaryText">
                      ETH amount (between 32 and 2048)
                    </Typography>
                  </Box>
                )}

                {/* Generated Command */}
                {validatorType && (
                  <Box className="mb-4">
                    <Typography className="mb-3 font-semibold text-white">
                      Step 4: Generate deposit keys using the CLI
                    </Typography>
                    <Typography className="mb-3 text-secondaryText">
                      Run the following command to generate your validator keys:
                    </Typography>
                    <Box className="mb-4 rounded bg-[#171717] p-3 font-mono text-sm text-white">
                      {generateCliCommand()}
                    </Box>
                    <Box className="mb-4 rounded-lg border border-red-600 bg-[#4a2d2d] p-4">
                      <Typography className="mb-2 font-semibold text-white">
                        ⚠️ Security Note:
                      </Typography>
                      <Typography className="text-secondaryText">
                        It is recommended to run on an offline computer for
                        maximum security.
                      </Typography>
                    </Box>
                    <Typography className="text-secondaryText">
                      Now follow the instructions presented to you in the
                      terminal window to generate your keys.
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Source Option Section */}
              <Box id="source-option" className="mb-12">
                <Typography variant="h4" className="mb-6 font-bold text-white">
                  Option 3: Build from Source
                </Typography>
                <Typography className="mb-4 text-secondaryText">
                  Building from source provides the highest level of security
                  assurance by allowing you to audit and compile the code
                  yourself.
                </Typography>

                <Box className="mb-4 rounded-lg border border-green-600 bg-[#1a4d3a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Security Benefits:
                  </Typography>
                  <Typography className="text-secondaryText">
                    Building from source allows you to inspect the code, verify
                    its integrity, and ensure no malicious modifications have
                    been made to the key generation process.
                  </Typography>
                </Box>

                {/* Operating System Selection */}
                <Box className="mb-6">
                  <Typography className="mb-3 font-semibold text-white">
                    Choose your operating system:
                  </Typography>
                  <Box className="grid grid-cols-3 gap-3">
                    {["Linux", "Windows", "Mac"].map((os) => (
                      <Box
                        key={os}
                        onClick={() => setOperatingSystem(os)}
                        className={`cursor-pointer rounded-lg border bg-[#2a2a2a] p-3 text-center transition-colors ${
                          operatingSystem === os
                            ? "border-blue"
                            : "border-transparent hover:border-blue"
                        }`}
                      >
                        <Typography className="font-semibold text-white">
                          {os}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Typography className="mb-4 font-semibold">
                  Build deposit-cli from the Python source code
                </Typography>

                {/* Install Python Section */}
                <Typography className="mb-2 font-semibold">
                  Install python3.9+
                </Typography>
                {operatingSystem === "Linux" && (
                  <Box className="mb-4">
                    <Typography className="mb-2 text-secondaryText">
                      The python3 install process may differ depending on your
                      linux build.
                    </Typography>
                    <Typography className="mb-2 text-secondaryText">
                      If you need help, check out the Python documentation.
                    </Typography>
                    <Link
                      href="https://www.python.org/about/gettingstarted/"
                      target="_blank"
                      className="mb-3 block"
                    >
                      Python installation instructions ↗
                    </Link>
                    <Box className="mb-4 rounded bg-[#2a2a2a] p-3">
                      <Typography className="text-secondaryText">
                        You can check your Python version by typing{" "}
                        <code className="rounded bg-[#171717] px-1 text-white">
                          python3 -V
                        </code>{" "}
                        in your terminal.
                      </Typography>
                    </Box>
                  </Box>
                )}
                {operatingSystem === "Windows" && (
                  <Box className="mb-4">
                    <Typography className="mb-2 text-secondaryText">
                      Download python3 and follow the installation instructions.
                    </Typography>
                    <ul className="mb-2 ml-4 space-y-1 text-secondaryText">
                      <li>
                        •{" "}
                        <Link
                          href="https://docs.python.org/3/using/windows.html"
                          target="_blank"
                        >
                          python.org ↗
                        </Link>
                      </li>
                      <li>
                        •{" "}
                        <Link
                          href="https://community.chocolatey.org/packages/python"
                          target="_blank"
                        >
                          Chocolatey ↗
                        </Link>
                      </li>
                    </ul>
                    <Typography className="mb-2 text-secondaryText">
                      If you need help, check out the Python documentation.
                    </Typography>
                    <Link
                      href="https://www.python.org/about/gettingstarted/"
                      target="_blank"
                      className="mb-3 block"
                    >
                      Python installation instructions ↗
                    </Link>
                    <Box className="mb-4 rounded bg-[#2a2a2a] p-3">
                      <Typography className="text-secondaryText">
                        You can check your Python version by typing{" "}
                        <code className="rounded bg-[#171717] px-1 text-white">
                          python -V
                        </code>{" "}
                        in your terminal.
                      </Typography>
                    </Box>
                  </Box>
                )}
                {operatingSystem === "Mac" && (
                  <Box className="mb-4">
                    <Typography className="mb-2 text-secondaryText">
                      You can install python3 on your macOS device using{" "}
                      <Link href="https://docs.brew.sh/Manpage" target="_blank">
                        Homebrew ↗
                      </Link>
                    </Typography>
                    <Typography className="mb-2 text-secondaryText">
                      If you need help, check out the Python documentation.
                    </Typography>
                    <Link
                      href="https://www.python.org/about/gettingstarted/"
                      target="_blank"
                      className="mb-3 block"
                    >
                      Python installation instructions ↗
                    </Link>
                    <Box className="mb-4 rounded bg-[#2a2a2a] p-3">
                      <Typography className="text-secondaryText">
                        You can check your Python version by typing{" "}
                        <code className="rounded bg-[#171717] px-1 text-white">
                          python3 -V
                        </code>{" "}
                        in your terminal.
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Install pip3 Section */}
                <Typography className="mb-2 font-semibold">
                  Install pip3
                </Typography>
                {operatingSystem === "Linux" && (
                  <Box className="mb-4">
                    <Typography className="mb-2 text-secondaryText">
                      You can install pip using a Linux Package Manager like{" "}
                      <code className="rounded bg-[#171717] px-1 text-white">
                        apt
                      </code>{" "}
                      or{" "}
                      <code className="rounded bg-[#171717] px-1 text-white">
                        yum
                      </code>
                      .
                    </Typography>
                    <Link
                      href="https://packaging.python.org/en/latest/guides/installing-using-linux-tools/#installing-pip-setuptools-wheel-with-linux-package-managers"
                      target="_blank"
                    >
                      More on installing pip ↗
                    </Link>
                  </Box>
                )}
                {operatingSystem === "Windows" && (
                  <Box className="mb-4">
                    <Typography className="mb-2 text-secondaryText">
                      The latest version of pip should have been installed with
                      python 3.x.x. For more information about installing pip on
                      Windows, visit{" "}
                      <Link
                        href="https://pip.pypa.io/en/stable/installation/"
                        target="_blank"
                      >
                        pip ↗
                      </Link>
                      . Or you can install the pip package via{" "}
                      <Link
                        href="https://community.chocolatey.org/packages/pip"
                        target="_blank"
                      >
                        Chocolatey ↗
                      </Link>
                      .
                    </Typography>
                  </Box>
                )}
                {operatingSystem === "Mac" && (
                  <Box className="mb-4">
                    <Typography className="mb-2 text-secondaryText">
                      You can also use{" "}
                      <Link href="https://docs.brew.sh/Manpage" target="_blank">
                        homebrew ↗
                      </Link>{" "}
                      to install pip3. For the most-up-to-date instructions on
                      installing pip3, and for a direct download link, reference
                      the{" "}
                      <Link
                        href="https://pip.pypa.io/en/stable/installation/"
                        target="_blank"
                      >
                        pip documentation ↗
                      </Link>
                    </Typography>
                  </Box>
                )}

                {/* Install virtualenv Section */}
                <Typography className="mb-2 font-semibold">
                  Install virtualenv
                </Typography>
                <Typography className="mb-2 text-secondaryText">
                  virtualenv would help you to create an isolated Python
                  environment for deposit-cli tool.
                </Typography>
                <Link
                  href="https://virtualenv.pypa.io/en/latest/installation.html"
                  target="_blank"
                  className="mb-4 block"
                >
                  More on virtualenv ↗
                </Link>

                {/* Install deposit-cli tool Section */}
                <Typography className="mb-2 font-semibold">
                  Install deposit-cli tool
                </Typography>
                <Typography className="mb-3 text-secondaryText">
                  Download and uncompress the master branch source code from
                  GitHub.
                </Typography>

                <Box className="mb-4 rounded bg-[#2a2a2a] p-3">
                  <Typography className="mb-2 text-secondaryText">
                    If you are a git user, you can run
                  </Typography>
                  <Box className="rounded bg-[#171717] p-2 font-mono text-sm text-white">
                    git clone -b master --single-branch
                    https://github.com/ethstaker/ethstaker-deposit-cli.git
                  </Box>
                  <Typography className="mt-2 text-secondaryText">
                    to download the{" "}
                    <code className="rounded bg-[#171717] px-1 text-white">
                      master
                    </code>{" "}
                    branch.
                  </Typography>
                </Box>

                <Typography className="mb-2 text-secondaryText">
                  First, create a venv virtualenv under repository directory:
                </Typography>
                <Box className="mb-4 rounded bg-[#171717] p-3 font-mono text-sm text-white">
                  {operatingSystem === "Windows" ? (
                    <>
                      virtualenv venv
                      <br />
                      .\venv\Scripts\activate
                    </>
                  ) : (
                    <>
                      virtualenv venv
                      <br />
                      source venv/bin/activate
                    </>
                  )}
                </Box>

                <Typography className="mb-2 text-secondaryText">
                  Second, install the dependency packages:
                </Typography>
                <Box className="mb-4 rounded bg-[#171717] p-3 font-mono text-sm text-white">
                  pip3 install -r requirements.txt
                </Box>

                <Typography className="mb-4 mt-6 text-lg font-bold text-white">
                  Generate Deposit Keys
                </Typography>

                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Command Options:
                  </Typography>
                  <Typography className="mb-3 text-secondaryText">
                    Choose EITHER regular withdrawal OR compounding (not both):
                  </Typography>
                  <Box className="mb-3 ml-4">
                    <Typography className="mb-2 text-white">
                      <strong>For Regular Withdrawal (0x01):</strong>
                    </Typography>
                    <ul className="ml-4 space-y-1 text-secondaryText">
                      <li>
                        •{" "}
                        <code className="text-white">--regular-withdrawal</code>
                        : Create regular withdrawal validators
                      </li>
                      <li>
                        • <code className="text-white">--num_validators</code>:
                        Number of validators to create (1 or more)
                      </li>
                      <li>
                        •{" "}
                        <em>
                          Note: --amount is omitted (each validator uses exactly
                          32 ETH)
                        </em>
                      </li>
                    </ul>
                  </Box>
                  <Box className="mb-3 ml-4">
                    <Typography className="mb-2 text-white">
                      <strong>For Compounding (0x02):</strong>
                    </Typography>
                    <ul className="ml-4 space-y-1 text-secondaryText">
                      <li>
                        • <code className="text-white">--compounding</code>:
                        Create compounding validators
                      </li>
                      <li>
                        • <code className="text-white">--amount</code>: Amount
                        of ETH to stake (32 to 2048 ETH)
                      </li>
                      <li>
                        •{" "}
                        <em>
                          Note: --num_validators is always 1 for compounding
                        </em>
                      </li>
                    </ul>
                  </Box>
                  <Typography className="mb-2 text-white">
                    <strong>Common Options:</strong>
                  </Typography>
                  <ul className="mb-2 ml-4 space-y-1 text-secondaryText">
                    <li>
                      • <code className="text-white">--chain</code>: Network
                      (mainnet, hoodi, etc.)
                    </li>
                    <li>
                      • <code className="text-white">--withdrawal_address</code>
                      : Execution address for withdrawals that you control
                    </li>
                  </ul>
                  <Typography className="text-secondaryText">
                    You can view the full list of command options{" "}
                    <Link
                      href="https://deposit-cli.ethstaker.cc/new_mnemonic.html"
                      target="_blank"
                    >
                      here
                    </Link>
                    .
                  </Typography>
                </Box>

                <Typography className="mb-4 font-semibold text-white">
                  Let&apos;s walk you through constructing the command step by
                  step:
                </Typography>

                {/* Withdrawal Address Input */}
                <Box className="mb-6">
                  <Typography className="mb-3 font-semibold text-white">
                    Step 1: Enter your withdrawal address
                  </Typography>
                  <Typography className="mb-3 text-secondaryText">
                    This is the Ethereum address where your staking rewards and
                    principal will be sent when you withdraw.
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="0x..."
                    value={withdrawalAddress}
                    onChange={(e) => setWithdrawalAddress(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#2a2a2a",
                        "& fieldset": { borderColor: "#404040" },
                        "&:hover fieldset": { borderColor: "#606060" },
                        "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                      },
                      "& .MuiInputBase-input": { color: "white" },
                    }}
                  />
                </Box>

                {/* Validator Type Selection */}
                <Box className="mb-6">
                  <Typography className="mb-3 font-semibold text-white">
                    Step 2: Choose your validator type
                  </Typography>
                  <Box className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Box
                      onClick={() => {
                        setValidatorType("0x01");
                        setValidatorCount(1);
                        setEthAmount(32);
                      }}
                      className={`cursor-pointer rounded-lg border bg-[#2a2a2a] p-4 transition-colors ${
                        validatorType === "0x01"
                          ? "border-blue"
                          : "border-transparent hover:border-blue"
                      }`}
                    >
                      <Typography className="mb-2 font-semibold text-white">
                        0x01 - Regular Withdrawal
                      </Typography>
                      <Typography className="text-sm text-secondaryText">
                        Rewards are automatically sent to your withdrawal
                        address. Validator balance stays at 32 ETH. Good for
                        regular income.
                      </Typography>
                    </Box>
                    <Box
                      onClick={() => {
                        setValidatorType("0x02");
                        setValidatorCount(1);
                        setEthAmount(32);
                      }}
                      className={`cursor-pointer rounded-lg border bg-[#2a2a2a] p-4 transition-colors ${
                        validatorType === "0x02"
                          ? "border-blue"
                          : "border-transparent hover:border-blue"
                      }`}
                    >
                      <Typography className="mb-2 font-semibold text-white">
                        0x02 - Compounding
                      </Typography>
                      <Typography className="text-sm text-secondaryText">
                        Rewards accumulate with the validator, increasing
                        earning potential. Can stake 32-2048 ETH. Better for
                        long-term growth.
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Conditional Inputs */}
                {validatorType === "0x01" && (
                  <Box className="mb-6">
                    <Typography className="mb-3 font-semibold text-white">
                      Step 3: Number of validators
                    </Typography>
                    <Typography className="mb-3 text-secondaryText">
                      Each validator requires exactly 32 ETH. How many
                      validators would you like to create?
                    </Typography>
                    <TextField
                      type="number"
                      value={validatorCount}
                      onChange={(e) =>
                        setValidatorCount(
                          Math.max(1, parseInt(e.target.value) || 1),
                        )
                      }
                      inputProps={{ min: 1 }}
                      sx={{
                        width: "200px",
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#2a2a2a",
                          "& fieldset": { borderColor: "#404040" },
                          "&:hover fieldset": { borderColor: "#606060" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                        "& .MuiInputBase-input": { color: "white" },
                      }}
                    />
                  </Box>
                )}

                {validatorType === "0x02" && (
                  <Box className="mb-6">
                    <Typography className="mb-3 font-semibold text-white">
                      Step 3: ETH amount to stake
                    </Typography>
                    <Typography className="mb-3 text-secondaryText">
                      Enter how much ETH to stake (32 to 2048 ETH):
                    </Typography>
                    <TextField
                      type="number"
                      value={ethAmount}
                      onChange={(e) =>
                        setEthAmount(
                          Math.max(
                            32,
                            Math.min(2048, parseInt(e.target.value) || 32),
                          ),
                        )
                      }
                      inputProps={{ min: 32, max: 2048 }}
                      sx={{
                        width: "200px",
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#2a2a2a",
                          "& fieldset": { borderColor: "#404040" },
                          "&:hover fieldset": { borderColor: "#606060" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                        "& .MuiInputBase-input": { color: "white" },
                      }}
                    />
                    <Typography className="mt-2 text-sm text-secondaryText">
                      ETH amount (between 32 and 2048)
                    </Typography>
                  </Box>
                )}

                {/* Generated Command */}
                {validatorType && (
                  <Box className="mb-4">
                    <Typography className="mb-3 font-semibold text-white">
                      Step 4: Generate deposit keys using Python
                    </Typography>
                    <Typography className="mb-3 text-secondaryText">
                      Run the following command to generate your validator keys:
                    </Typography>
                    <Box className="mb-4 rounded bg-[#171717] p-3 font-mono text-sm text-white">
                      {operatingSystem === "Windows"
                        ? `.\\ethstaker_deposit\\deposit.py ${generateCliCommand().replace(
                            "./deposit ",
                            "",
                          )}`
                        : `python3 -m ethstaker_deposit ${generateCliCommand().replace(
                            "./deposit ",
                            "",
                          )}`}
                    </Box>
                    <Box className="mb-4 rounded-lg border border-red-600 bg-[#4a2d2d] p-4">
                      <Typography className="mb-2 font-semibold text-white">
                        ⚠️ Security Note:
                      </Typography>
                      <Typography className="text-secondaryText">
                        For security, we recommend you disconnect from the
                        internet to complete this step.
                      </Typography>
                    </Box>
                    <Typography className="text-secondaryText">
                      Now follow the instructions presented to you in the
                      terminal window to generate your keys.
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Saving Keys Section */}
              <Box id="saving-keys" className="mb-12">
                <Typography variant="h4" className="mb-6 font-bold text-white">
                  Saving Your Key Files
                </Typography>
                <Typography className="mb-4 text-secondaryText">
                  Properly securing and backing up your generated files is
                  crucial for validator operation and fund recovery.
                </Typography>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Generated Files:
                  </Typography>
                  <ul className="ml-4 space-y-2 text-secondaryText">
                    <li>
                      •{" "}
                      <strong className="text-white">deposit_data.json:</strong>{" "}
                      Contains the public key(s) associated with your
                      validator(s). This file will be uploaded to the dashboard
                      to complete your deposits.
                    </li>
                    <li>
                      • <strong className="text-white">keystore.json:</strong>{" "}
                      Contains your signing key, encrypted with your password.
                      You will see one keystore per validator
                    </li>
                    <li>
                      • <strong className="text-white">Mnemonic phrase:</strong>{" "}
                      Master seed for key recovery. This should be written down
                      and stored in a secure location.
                    </li>
                  </ul>
                </Box>
                <Box className="mb-4 rounded-lg border border-red-600 bg-[#4a2d2d] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Critical Security Steps:
                  </Typography>
                  <ul className="ml-4 space-y-1 text-secondaryText">
                    <li>
                      • Write down your mnemonic phrase on paper (never store it
                      digitally)
                    </li>
                    <li>
                      • Store the paper backup in multiple secure locations
                    </li>
                    <li>• Never share your mnemonic or keystore passwords</li>
                    <li>• Keep keystore files secure and backed up</li>
                    <li>• Verify your backup before deleting any files</li>
                  </ul>
                </Box>
                <Box className="mb-4 rounded-lg bg-[#2a2a2a] p-4">
                  <Typography className="mb-2 font-semibold text-white">
                    Next Steps:
                  </Typography>
                  <Typography className="text-secondaryText">
                    Upload the generated deposit_data.json file using the
                    deposit flow to complete the deposit for each validator.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
