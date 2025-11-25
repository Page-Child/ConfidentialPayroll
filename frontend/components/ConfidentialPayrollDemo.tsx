"use client";

import { ethers } from "ethers";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useConfidentialPayroll } from "@/hooks/useConfidentialPayroll";
import { useState } from "react";

export const ConfidentialPayrollDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const payroll = useConfidentialPayroll({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [salaryInput, setSalaryInput] = useState<string>("");
  const [viewerAddressInput, setViewerAddressInput] = useState<string>("");
  const [otherEmployeeAddressInput, setOtherEmployeeAddressInput] = useState<string>("");

  const buttonClass =
    "inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold text-white shadow-lg " +
    "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 " +
    "transition-all duration-200 transform hover:scale-105 active:scale-95 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 " +
    "shadow-blue-500/30";

  const secondaryButtonClass =
    "inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold text-blue-300 " +
    "border-2 border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 " +
    "transition-all duration-200 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const inputClass =
    "flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent " +
    "transition-all duration-200";

  const cardClass = "card-gradient rounded-xl p-6 shadow-xl hover-lift animate-fade-in";
  
  const titleClass = "text-xl font-bold text-white mb-4 flex items-center space-x-2";

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/50">
          <svg 
            className="w-12 h-12 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Welcome to Confidential Payroll</h2>
          <p className="text-gray-400 max-w-md">
            Connect your MetaMask wallet to access the encrypted salary management system
          </p>
        </div>
        <button
          className={buttonClass + " text-lg px-8 py-4"}
          disabled={isConnected}
          onClick={connect}
        >
          <svg 
            className="w-6 h-6 mr-2" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
              clipRule="evenodd" 
            />
          </svg>
          Connect to MetaMask
        </button>
      </div>
    );
  }

  // Only show "Contract Not Deployed" when:
  // 1. isDeployed is explicitly false (not undefined)
  // 2. chainId is defined (not undefined)
  // This prevents showing error when chainId is undefined or still loading
  if (payroll.isDeployed === false && chainId !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center border-4 border-red-500">
          <svg 
            className="w-12 h-12 text-red-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-red-400">Contract Not Deployed</h2>
          <p className="text-gray-400 max-w-md">
            The ConfidentialPayroll contract is not deployed on the current network
          </p>
          <p className="text-sm text-gray-500 font-mono">
            Chain ID: {chainId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* System Status Banner */}
      <div className={cardClass}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            <div>
              <h3 className="text-lg font-bold text-white">System Connected</h3>
              <p className="text-sm text-gray-400">All systems operational</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusBadge 
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              }
              label="FHEVM"
              value={fhevmInstance ? "Ready" : "Loading"}
              status={fhevmInstance ? "success" : "warning"}
            />
            <StatusBadge 
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
              }
              label="Contract"
              value={payroll.isDeployed ? "Deployed" : "Not Found"}
              status={payroll.isDeployed ? "success" : "error"}
            />
            <StatusBadge 
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              }
              label="Chain"
              value={`ID: ${chainId}`}
              status="info"
            />
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className={cardClass}>
        <div className={titleClass}>
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Account Information</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <InfoItem 
            label="Your Wallet Address" 
            value={ethersSigner?.address || "Not connected"}
            mono
          />
          <InfoItem 
            label="Contract Address" 
            value={payroll.contractAddress || "Not available"}
            mono
            truncate
          />
          <InfoItem 
            label="Network Chain ID" 
            value={chainId || "Unknown"}
          />
        </div>
      </div>

      {/* System Status Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <div className={titleClass}>
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Encryption Status</span>
          </div>
          <div className="space-y-2">
            {renderStatusItem("FHEVM Instance", fhevmInstance ? "Initialized" : "Not Ready", !!fhevmInstance)}
            {renderStatusItem("Encryption Ready", fhevmStatus, fhevmStatus === "ready")}
            {renderStatusItem("Error Status", fhevmError?.message ?? "No errors detected", !fhevmError)}
          </div>
        </div>

        <div className={cardClass}>
          <div className={titleClass}>
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Operation Status</span>
          </div>
          <div className="space-y-2">
            {renderStatusItem("Refreshing Data", payroll.isRefreshing ? "Active" : "Idle", !payroll.isRefreshing)}
            {renderStatusItem("Decrypting", payroll.isDecrypting ? "Processing" : "Idle", !payroll.isDecrypting)}
            {renderStatusItem("Adding Salary", payroll.isAddingSalary ? "Processing" : "Idle", !payroll.isAddingSalary)}
            {renderStatusItem("Granting Access", payroll.isGrantingAccess ? "Processing" : "Idle", !payroll.isGrantingAccess)}
          </div>
        </div>
      </div>

      {/* Add Salary Section */}
      <div className={cardClass}>
        <div className={titleClass}>
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Encrypted Salary</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Enter your salary amount. It will be encrypted and stored securely on the blockchain.
        </p>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              placeholder="Enter salary amount (e.g., 50000)"
              className={inputClass}
            />
          </div>
          <button
            className={buttonClass}
            disabled={!payroll.canAddSalary || !salaryInput}
            onClick={() => {
              const amount = parseInt(salaryInput);
              if (amount > 0) {
                payroll.addSalary(amount);
                setSalaryInput("");
              }
            }}
          >
            {payroll.isAddingSalary ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Salary
              </>
            )}
          </button>
        </div>
      </div>

      {/* My Salary Section */}
      <div className={cardClass}>
        <div className={titleClass}>
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span>My Encrypted Salary</span>
        </div>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <InfoItem 
              label="Salary Handle (Encrypted)" 
              value={payroll.salaryHandle || "No salary data"}
              mono
              truncate
            />
            <InfoItem 
              label="Decrypted Value" 
              value={
                payroll.isDecrypted
                  ? `$${payroll.clearSalary?.toLocaleString()}`
                  : "••••••••"
              }
              highlight={payroll.isDecrypted}
            />
          </div>
          <button
            className={buttonClass + " w-full md:w-auto"}
            disabled={!payroll.canDecryptSalary}
            onClick={payroll.decryptSalary}
          >
            {payroll.isDecrypting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Decrypting...
              </>
            ) : payroll.isDecrypted ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Decrypted: ${payroll.clearSalary?.toLocaleString()}
              </>
            ) : payroll.canDecryptSalary ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Decrypt My Salary
              </>
            ) : (
              "No salary to decrypt"
            )}
          </button>
        </div>
      </div>

      {/* Statistics Section (Deployer Only) */}
      {payroll.deployer &&
        ethersSigner?.address.toLowerCase() === payroll.deployer.toLowerCase() && (
          <div className={cardClass + " border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-gray-900"}>
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xl font-bold text-yellow-400">Company Statistics</span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/50">
                Admin Only
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              As the contract deployer, you can view encrypted company-wide statistics.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-white">{payroll.employeeCount?.toString() || "0"}</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Total Salary</p>
                <p className="text-2xl font-bold text-white">
                  {payroll.isTotalDecrypted
                    ? `$${payroll.clearTotalSalary?.toLocaleString()}`
                    : "••••••••"}
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Average Salary</p>
                <p className="text-2xl font-bold text-white">
                  {payroll.isAverageDecrypted
                    ? `$${payroll.clearAverageSalary?.toLocaleString()}`
                    : "••••••••"}
                </p>
              </div>
            </div>
            <button
              className={buttonClass + " w-full md:w-auto"}
              disabled={!payroll.canDecryptStatistics}
              onClick={payroll.decryptStatistics}
            >
              {payroll.isDecrypting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Decrypting Statistics...
                </>
              ) : payroll.canDecryptStatistics ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Decrypt Statistics
                </>
              ) : (
                "Statistics Decrypted"
              )}
            </button>
          </div>
        )}

      {/* Grant Access Section */}
      <div className={cardClass}>
        <div className={titleClass}>
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span>Grant Salary Access</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Allow another wallet address to view your encrypted salary data. This permission can be useful for HR, managers, or auditors.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={viewerAddressInput}
            onChange={(e) => setViewerAddressInput(e.target.value)}
            placeholder="Enter viewer wallet address (0x...)"
            className={inputClass}
          />
          <button
            className={buttonClass}
            disabled={!payroll.canGrantAccess || !viewerAddressInput}
            onClick={() => {
              payroll.grantAccess(viewerAddressInput);
              setViewerAddressInput("");
            }}
          >
            {payroll.isGrantingAccess ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Granting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Grant Access
              </>
            )}
          </button>
        </div>
      </div>

      {/* View Other Employee's Salary Section */}
      <div className={cardClass}>
        <div className={titleClass}>
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>View Other Employee Salary</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          View the salary of another employee who has granted you explicit access to their encrypted data.
        </p>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={otherEmployeeAddressInput}
            onChange={(e) => setOtherEmployeeAddressInput(e.target.value)}
            placeholder="Enter employee wallet address (0x...)"
            className={inputClass}
          />
          <button
            className={secondaryButtonClass}
            disabled={
              !payroll.canViewOtherSalary || 
              !otherEmployeeAddressInput || 
              !ethers.isAddress(otherEmployeeAddressInput.trim())
            }
            onClick={() => {
              payroll.viewOtherSalary(otherEmployeeAddressInput.trim());
            }}
          >
            {payroll.isViewingOtherSalary ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Check Access
              </>
            )}
          </button>
        </div>
        {payroll.otherEmployeeAddress && (
          <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <InfoItem 
                label="Employee Address" 
                value={payroll.otherEmployeeAddress}
                mono
                truncate
              />
              <InfoItem 
                label="Access Permission" 
                value={payroll.hasAccessToOther ? "Granted" : "Denied"}
                highlight={payroll.hasAccessToOther}
              />
              <InfoItem 
                label="Salary Handle" 
                value={payroll.otherSalaryHandle || "Not available"}
                mono
                truncate
              />
              <InfoItem 
                label="Decrypted Salary" 
                value={
                  payroll.isOtherSalaryDecrypted
                    ? `$${payroll.clearOtherSalary?.toLocaleString()}`
                    : "••••••••"
                }
                highlight={payroll.isOtherSalaryDecrypted}
              />
            </div>
            {payroll.hasAccessToOther && (
              <button
                className={buttonClass + " w-full md:w-auto"}
                disabled={!payroll.canDecryptOtherSalary}
                onClick={payroll.decryptOtherSalary}
              >
                {payroll.isDecrypting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Decrypting...
                  </>
                ) : payroll.isOtherSalaryDecrypted ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Decrypted: ${payroll.clearOtherSalary?.toLocaleString()}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Decrypt Employee Salary
                  </>
                )}
              </button>
            )}
            {!payroll.hasAccessToOther && (
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>You do not have permission to view this employee's salary</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Messages */}
      {payroll.message && (
        <div className="glass-effect rounded-xl p-6 border-l-4 border-blue-500">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">System Message</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{payroll.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
function StatusBadge({ 
  icon, 
  label, 
  value, 
  status 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  status: "success" | "error" | "warning" | "info" 
}) {
  const statusColors = {
    success: "bg-green-500/20 text-green-300 border-green-500/50",
    error: "bg-red-500/20 text-red-300 border-red-500/50",
    warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
    info: "bg-blue-500/20 text-blue-300 border-blue-500/50",
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${statusColors[status]}`}>
      {icon}
      <div className="text-xs">
        <p className="opacity-70">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function InfoItem({ 
  label, 
  value, 
  mono = false, 
  truncate = false,
  highlight = false 
}: { 
  label: string; 
  value: string | number; 
  mono?: boolean;
  truncate?: boolean;
  highlight?: boolean;
}) {
  const valueClass = `text-base font-semibold ${
    highlight ? "text-green-400" : "text-white"
  } ${mono ? "font-mono text-sm" : ""} ${
    truncate ? "truncate" : ""
  }`;

  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={valueClass} title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function renderStatusItem(label: string, value: string, isGood: boolean) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
      <span className="text-gray-300 text-sm">{label}</span>
      <div className="flex items-center space-x-2">
        <span className="text-white font-mono text-sm">{value}</span>
        {isGood ? (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}

