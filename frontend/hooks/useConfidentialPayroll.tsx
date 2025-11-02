"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

import { ConfidentialPayrollAddresses } from "@/abi/ConfidentialPayrollAddresses";
import { ConfidentialPayrollABI } from "@/abi/ConfidentialPayrollABI";

export type ClearValueType = {
  handle: string;
  clear: string | bigint | boolean;
};

type ConfidentialPayrollInfoType = {
  abi: typeof ConfidentialPayrollABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getConfidentialPayrollByChainId(
  chainId: number | undefined
): ConfidentialPayrollInfoType {
  if (!chainId) {
    return { abi: ConfidentialPayrollABI.abi };
  }

  const chainIdStr = chainId.toString();
  type AddressEntry = { address: string; chainId: number; chainName: string };
  const entry = ConfidentialPayrollAddresses[chainIdStr as keyof typeof ConfidentialPayrollAddresses] as AddressEntry | undefined;

  if (!entry) {
    return { abi: ConfidentialPayrollABI.abi, chainId };
  }

  if (!entry.address || entry.address === ethers.ZeroAddress) {
    return { abi: ConfidentialPayrollABI.abi, chainId };
  }

  return {
    address: entry.address as `0x${string}`,
    chainId: entry.chainId ?? chainId,
    chainName: entry.chainName,
    abi: ConfidentialPayrollABI.abi,
  };
}

export const useConfidentialPayroll = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  // States
  const [salaryHandle, setSalaryHandle] = useState<string | undefined>(undefined);
  const [totalSalaryHandle, setTotalSalaryHandle] = useState<string | undefined>(undefined);
  const [averageSalaryHandle, setAverageSalaryHandle] = useState<string | undefined>(undefined);
  const [employeeCount, setEmployeeCount] = useState<bigint | undefined>(undefined);
  const [deployer, setDeployer] = useState<string | undefined>(undefined);
  const [clearSalary, setClearSalary] = useState<ClearValueType | undefined>(undefined);
  const [clearTotalSalary, setClearTotalSalary] = useState<ClearValueType | undefined>(undefined);
  const [clearAverageSalary, setClearAverageSalary] = useState<ClearValueType | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isAddingSalary, setIsAddingSalary] = useState<boolean>(false);
  const [isGrantingAccess, setIsGrantingAccess] = useState<boolean>(false);
  const [isViewingOtherSalary, setIsViewingOtherSalary] = useState<boolean>(false);
  const [otherSalaryHandle, setOtherSalaryHandle] = useState<string | undefined>(undefined);
  const [otherEmployeeAddress, setOtherEmployeeAddress] = useState<string | undefined>(undefined);
  const [clearOtherSalary, setClearOtherSalary] = useState<ClearValueType | undefined>(undefined);
  const [hasAccessToOther, setHasAccessToOther] = useState<boolean | undefined>(undefined);
  const [message, setMessage] = useState<string>("");

  const payrollRef = useRef<ConfidentialPayrollInfoType | undefined>(undefined);
  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isDecryptingRef = useRef<boolean>(isDecrypting);
  const isAddingSalaryRef = useRef<boolean>(isAddingSalary);
  const clearSalaryRef = useRef<ClearValueType | undefined>(undefined);
  const clearTotalSalaryRef = useRef<ClearValueType | undefined>(undefined);
  const clearAverageSalaryRef = useRef<ClearValueType | undefined>(undefined);
  const clearOtherSalaryRef = useRef<ClearValueType | undefined>(undefined);
  const isViewingOtherSalaryRef = useRef<boolean>(false);

  const isDecrypted = Boolean(salaryHandle && salaryHandle === clearSalary?.handle);
  const isTotalDecrypted = Boolean(totalSalaryHandle && totalSalaryHandle === clearTotalSalary?.handle);
  // Average is calculated client-side after total is decrypted, so check if total is decrypted and employeeCount exists
  const isAverageDecrypted = Boolean(
    isTotalDecrypted && employeeCount && employeeCount > 0n && clearAverageSalary !== undefined
  );
  const isOtherSalaryDecrypted = Boolean(
    otherSalaryHandle && otherSalaryHandle === clearOtherSalary?.handle
  );

  // Contract info
  const payroll = useMemo(() => {
    const c = getConfidentialPayrollByChainId(chainId);
    payrollRef.current = c;
    // Only show deployment not found message when:
    // 1. chainId is defined (not undefined) - we know the network
    // 2. contract address is not configured for this network - deployment is missing
    // This prevents showing "deployment not found for chainId=undefined" when chainId is still loading
    if (chainId !== undefined && !c.address) {
      setMessage(`ConfidentialPayroll deployment not found for chainId=${chainId}.`);
    }
    // Note: We don't clear the message here when chainId is undefined or address exists,
    // as other operations may have set important messages that should be preserved
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!payroll) {
      return undefined;
    }
    return (Boolean(payroll.address) && payroll.address !== ethers.ZeroAddress);
  }, [payroll]);

  // Refresh salary handle
  const refreshSalaryHandle = useCallback(() => {
    if (isRefreshingRef.current || !ethersSigner) {
      return;
    }

    if (
      !payrollRef.current ||
      !payrollRef.current?.chainId ||
      !payrollRef.current?.address ||
      !ethersReadonlyProvider
    ) {
      setSalaryHandle(undefined);
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    const thisChainId = payrollRef.current.chainId;
    const thisPayrollAddress = payrollRef.current.address;
    const userAddress = ethersSigner.address;

    const thisPayrollContract = new ethers.Contract(
      thisPayrollAddress,
      payrollRef.current.abi,
      ethersReadonlyProvider
    );

    Promise.all([
      thisPayrollContract.getSalary(userAddress),
      thisPayrollContract.getTotalSalary(),
      thisPayrollContract.getAverageSalaryData(),
      thisPayrollContract.getEmployeeCount(),
      thisPayrollContract.getDeployer(),
    ])
      .then(([salary, total, averageData, count, deployerAddr]) => {
        if (
          sameChain.current(thisChainId) &&
          thisPayrollAddress === payrollRef.current?.address
        ) {
          setSalaryHandle(salary);
          setTotalSalaryHandle(total);
          // getAverageSalaryData returns {total, count}, but we don't store average handle anymore
          // Average will be calculated client-side after decryption
          setAverageSalaryHandle(undefined);
          setEmployeeCount(count);
          setDeployer(deployerAddr);
        }

        isRefreshingRef.current = false;
        setIsRefreshing(false);
      })
      .catch((e) => {
        setMessage("Failed to fetch payroll data! error=" + e);
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      });
  }, [ethersReadonlyProvider, ethersSigner, sameChain]);

  useEffect(() => {
    refreshSalaryHandle();
  }, [refreshSalaryHandle]);

  // Decrypt salary
  const canDecryptSalary = useMemo(() => {
    return (
      payroll.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isDecrypting &&
      salaryHandle &&
      salaryHandle !== ethers.ZeroHash &&
      salaryHandle !== clearSalary?.handle
    );
  }, [
    payroll.address,
    instance,
    ethersSigner,
    isRefreshing,
    isDecrypting,
    salaryHandle,
    clearSalary,
  ]);

  const decryptSalary = useCallback(() => {
    if (isRefreshingRef.current || isDecryptingRef.current) {
      return;
    }

    if (!payroll.address || !instance || !ethersSigner) {
      return;
    }

    if (salaryHandle === clearSalaryRef.current?.handle) {
      return;
    }

    if (!salaryHandle || salaryHandle === ethers.ZeroHash) {
      setClearSalary(undefined);
      clearSalaryRef.current = undefined;
      return;
    }

    const thisChainId = chainId;
    const thisPayrollAddress = payroll.address;
    const thisSalaryHandle = salaryHandle;
    const thisEthersSigner = ethersSigner;

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage("Start decrypting salary...");

    const run = async () => {
      const isStale = () =>
        thisPayrollAddress !== payrollRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [payroll.address as `0x${string}`],
            ethersSigner,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        setMessage("Call FHEVM userDecrypt...");

        const res = await instance.userDecrypt(
          [{ handle: thisSalaryHandle, contractAddress: thisPayrollAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        setMessage("FHEVM userDecrypt completed!");

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        setClearSalary({ handle: thisSalaryHandle, clear: res[thisSalaryHandle as `0x${string}`] });
        clearSalaryRef.current = {
          handle: thisSalaryHandle,
          clear: res[thisSalaryHandle as `0x${string}`],
        };

        setMessage("Salary decrypted: " + clearSalaryRef.current.clear);
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
      }
    };

    run();
  }, [
    fhevmDecryptionSignatureStorage,
    ethersSigner,
    payroll.address,
    instance,
    salaryHandle,
    chainId,
    sameChain,
    sameSigner,
  ]);

  // Decrypt total/average (only for deployer)
  const canDecryptStatistics = useMemo(() => {
    return (
      payroll.address &&
      instance &&
      ethersSigner &&
      deployer &&
      ethersSigner.address.toLowerCase() === deployer.toLowerCase() &&
      !isRefreshing &&
      !isDecrypting &&
      totalSalaryHandle
    );
  }, [
    payroll.address,
    instance,
    ethersSigner,
    deployer,
    isRefreshing,
    isDecrypting,
    totalSalaryHandle,
  ]);

  const decryptStatistics = useCallback(async () => {
    if (isRefreshingRef.current || isDecryptingRef.current) {
      return;
    }

    if (!payroll.address || !instance || !ethersSigner || !deployer) {
      return;
    }

    if (ethersSigner.address.toLowerCase() !== deployer.toLowerCase()) {
      setMessage("Only deployer can decrypt statistics");
      return;
    }

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage("Start decrypting statistics...");

    const thisChainId = chainId;
    const thisPayrollAddress = payroll.address;
    const thisEthersSigner = ethersSigner;

    try {
      const sig: FhevmDecryptionSignature | null =
        await FhevmDecryptionSignature.loadOrSign(
          instance,
          [payroll.address as `0x${string}`],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

      if (!sig) {
        setMessage("Unable to build FHEVM decryption signature");
        return;
      }

      const isStale = () =>
        thisPayrollAddress !== payrollRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      if (isStale()) {
        setMessage("Ignore FHEVM decryption");
        return;
      }

      setMessage("Call FHEVM userDecrypt for statistics...");

      const handles: Array<{ handle: string; contractAddress: string }> = [];
      if (totalSalaryHandle && totalSalaryHandle !== ethers.ZeroHash) {
        handles.push({ handle: totalSalaryHandle, contractAddress: thisPayrollAddress });
      }

      if (handles.length === 0) {
        setMessage("No statistics to decrypt");
        return;
      }

      const res = await instance.userDecrypt(
        handles,
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      if (isStale()) {
        setMessage("Ignore FHEVM decryption");
        return;
      }

      if (totalSalaryHandle && res[totalSalaryHandle as `0x${string}`] !== undefined) {
        const totalValue = res[totalSalaryHandle as `0x${string}`];
        setClearTotalSalary({ handle: totalSalaryHandle, clear: totalValue });
        clearTotalSalaryRef.current = {
          handle: totalSalaryHandle,
          clear: totalValue,
        };

        // Calculate average salary client-side: total / employeeCount
        if (employeeCount && employeeCount > 0n) {
          const averageValue = typeof totalValue === 'bigint'
            ? (totalValue as bigint) / (employeeCount as bigint)
            : String(Number(totalValue) / Number(employeeCount));
          const averageHandle = `${totalSalaryHandle}_average`; // Use a synthetic handle
          setClearAverageSalary({ handle: averageHandle, clear: averageValue });
          clearAverageSalaryRef.current = {
            handle: averageHandle,
            clear: averageValue,
          };
        }
      }

      setMessage("Statistics decrypted successfully!");
    } catch (e) {
      setMessage("Failed to decrypt statistics: " + e);
    } finally {
      isDecryptingRef.current = false;
      setIsDecrypting(false);
    }
  }, [
    fhevmDecryptionSignatureStorage,
    ethersSigner,
    payroll.address,
    instance,
    deployer,
    totalSalaryHandle,
    employeeCount,
    chainId,
    sameChain,
    sameSigner,
  ]);

  // Add salary
  const canAddSalary = useMemo(() => {
    return (
      payroll.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isAddingSalary
    );
  }, [payroll.address, instance, ethersSigner, isRefreshing, isAddingSalary]);

  const addSalary = useCallback(
    (salaryAmount: number) => {
      if (isRefreshingRef.current || isAddingSalaryRef.current) {
        return;
      }

      if (!payroll.address || !instance || !ethersSigner || salaryAmount <= 0) {
        return;
      }

      const thisChainId = chainId;
      const thisPayrollAddress = payroll.address;
      const thisEthersSigner = ethersSigner;
      const thisPayrollContract = new ethers.Contract(
        thisPayrollAddress,
        payroll.abi,
        thisEthersSigner
      );

      isAddingSalaryRef.current = true;
      setIsAddingSalary(true);
      setMessage(`Start adding salary ${salaryAmount}...`);

      const run = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const isStale = () =>
          thisPayrollAddress !== payrollRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          const input = instance.createEncryptedInput(
            thisPayrollAddress,
            thisEthersSigner.address
          );
          input.add32(salaryAmount);

          const enc = await input.encrypt();

          if (isStale()) {
            setMessage(`Ignore add salary`);
            return;
          }

          setMessage(`Call addSalary...`);

          const tx: ethers.TransactionResponse =
            await thisPayrollContract.addSalary(
              thisEthersSigner.address,
              enc.handles[0],
              enc.inputProof
            );

          setMessage(`Wait for tx:${tx.hash}...`);

          const receipt = await tx.wait();

          setMessage(`Add salary completed status=${receipt?.status}`);

          if (isStale()) {
            setMessage(`Ignore add salary`);
            return;
          }

          refreshSalaryHandle();
        } catch (e) {
          setMessage(`Add salary failed! ${e}`);
        } finally {
          isAddingSalaryRef.current = false;
          setIsAddingSalary(false);
        }
      };

      run();
    },
    [
      ethersSigner,
      payroll.address,
      payroll.abi,
      instance,
      chainId,
      refreshSalaryHandle,
      sameChain,
      sameSigner,
    ]
  );

  // Grant access
  const canGrantAccess = useMemo(() => {
    return (
      payroll.address &&
      ethersSigner &&
      !isRefreshing &&
      !isGrantingAccess
    );
  }, [payroll.address, ethersSigner, isRefreshing, isGrantingAccess]);

  const grantAccess = useCallback(
    async (viewerAddress: string) => {
      if (isRefreshingRef.current || isGrantingAccess) {
        return;
      }

      if (!payroll.address || !ethersSigner) {
        return;
      }

      if (!ethers.isAddress(viewerAddress)) {
        setMessage("Invalid viewer address");
        return;
      }

      setIsGrantingAccess(true);
      setMessage(`Granting access to ${viewerAddress}...`);

      try {
        const thisPayrollContract = new ethers.Contract(
          payroll.address,
          payroll.abi,
          ethersSigner
        );

        const tx = await thisPayrollContract.grantAccess(viewerAddress);
        setMessage(`Wait for tx:${tx.hash}...`);
        await tx.wait();
        setMessage("Access granted successfully!");
        refreshSalaryHandle();
      } catch (e) {
        setMessage(`Failed to grant access: ${e}`);
      } finally {
        setIsGrantingAccess(false);
      }
    },
    [payroll.address, payroll.abi, ethersSigner, refreshSalaryHandle]
  );

  // View other employee's salary (if authorized)
  // Note: This only checks system readiness, not the employee address validity
  // The address validation should be done in the component before calling viewOtherSalary
  const canViewOtherSalary = useMemo(() => {
    return (
      payroll.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isViewingOtherSalary
    );
  }, [payroll.address, instance, ethersSigner, isRefreshing, isViewingOtherSalary]);

  const viewOtherSalary = useCallback(async (employeeAddress: string) => {
    if (isViewingOtherSalaryRef.current || !ethersSigner || !ethersReadonlyProvider) {
      return;
    }

    if (!payroll.address || !ethers.isAddress(employeeAddress)) {
      setMessage("Invalid employee address");
      return;
    }

    if (employeeAddress.toLowerCase() === ethersSigner.address.toLowerCase()) {
      setMessage("Use 'My Salary' section to view your own salary");
      return;
    }

    isViewingOtherSalaryRef.current = true;
    setIsViewingOtherSalary(true);
    setMessage("Checking access and fetching salary...");
    setOtherEmployeeAddress(employeeAddress);

    const thisChainId = chainId;
    const thisPayrollAddress = payroll.address;
    const thisEthersSigner = ethersSigner;

    try {
      const thisPayrollContract = new ethers.Contract(
        thisPayrollAddress,
        payroll.abi,
        ethersReadonlyProvider
      );

      // Check if we have access
      const hasAccess = await thisPayrollContract.hasAccess(employeeAddress, ethersSigner.address);
      setHasAccessToOther(hasAccess);

      if (!hasAccess) {
        setMessage("You don't have access to view this employee's salary");
        setOtherSalaryHandle(undefined);
        return;
      }

      // Get the employee's salary handle
      const salaryHandle = await thisPayrollContract.getSalary(employeeAddress);

      if (!salaryHandle || salaryHandle === ethers.ZeroHash) {
        setMessage("This employee has not added their salary yet");
        setOtherSalaryHandle(undefined);
        return;
      }

      setOtherSalaryHandle(salaryHandle);
      setMessage("Salary handle fetched. You can decrypt it now.");
    } catch (e) {
      setMessage(`Failed to view salary: ${e}`);
      setOtherSalaryHandle(undefined);
    } finally {
      isViewingOtherSalaryRef.current = false;
      setIsViewingOtherSalary(false);
    }
  }, [
    payroll.address,
    payroll.abi,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
  ]);

  const canDecryptOtherSalary = useMemo(() => {
    return (
      payroll.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isDecrypting &&
      !isViewingOtherSalary &&
      otherSalaryHandle &&
      otherSalaryHandle !== ethers.ZeroHash &&
      otherSalaryHandle !== clearOtherSalary?.handle &&
      hasAccessToOther === true
    );
  }, [
    payroll.address,
    instance,
    ethersSigner,
    isRefreshing,
    isDecrypting,
    isViewingOtherSalary,
    otherSalaryHandle,
    clearOtherSalary,
    hasAccessToOther,
  ]);

  const decryptOtherSalary = useCallback(() => {
    if (isRefreshingRef.current || isDecryptingRef.current || isViewingOtherSalaryRef.current) {
      return;
    }

    if (!payroll.address || !instance || !ethersSigner || !otherSalaryHandle || !otherEmployeeAddress) {
      return;
    }

    if (otherSalaryHandle === clearOtherSalaryRef.current?.handle) {
      return;
    }

    if (!otherSalaryHandle || otherSalaryHandle === ethers.ZeroHash) {
      setClearOtherSalary(undefined);
      clearOtherSalaryRef.current = undefined;
      return;
    }

    const thisChainId = chainId;
    const thisPayrollAddress = payroll.address;
    const thisOtherSalaryHandle = otherSalaryHandle;
    const thisOtherEmployeeAddress = otherEmployeeAddress;
    const thisEthersSigner = ethersSigner;

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage("Start decrypting other employee's salary...");

    const run = async () => {
      const isStale = () =>
        thisPayrollAddress !== payrollRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [payroll.address as `0x${string}`],
            ethersSigner,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        setMessage("Call FHEVM userDecrypt for other employee's salary...");

        const res = await instance.userDecrypt(
          [{ handle: thisOtherSalaryHandle, contractAddress: thisPayrollAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        setClearOtherSalary({ handle: thisOtherSalaryHandle, clear: res[thisOtherSalaryHandle as `0x${string}`] });
        clearOtherSalaryRef.current = {
          handle: thisOtherSalaryHandle,
          clear: res[thisOtherSalaryHandle as `0x${string}`],
        };

        setMessage(`Salary decrypted for ${thisOtherEmployeeAddress}: ${clearOtherSalaryRef.current.clear}`);
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
      }
    };

    run();
  }, [
    fhevmDecryptionSignatureStorage,
    ethersSigner,
    payroll.address,
    instance,
    otherSalaryHandle,
    otherEmployeeAddress,
    chainId,
    sameChain,
    sameSigner,
  ]);

  return {
    contractAddress: payroll.address,
    isDeployed,
    canDecryptSalary,
    canDecryptStatistics,
    canAddSalary,
    canGrantAccess,
    canViewOtherSalary,
    canDecryptOtherSalary,
    decryptSalary,
    decryptStatistics,
    addSalary,
    grantAccess,
    viewOtherSalary,
    decryptOtherSalary,
    refreshSalaryHandle,
    isDecrypted,
    isTotalDecrypted,
    isAverageDecrypted,
    isOtherSalaryDecrypted,
    message,
    clearSalary: clearSalary?.clear,
    clearTotalSalary: clearTotalSalary?.clear,
    clearAverageSalary: clearAverageSalary?.clear,
    clearOtherSalary: clearOtherSalary?.clear,
    salaryHandle,
    totalSalaryHandle,
    averageSalaryHandle,
    otherSalaryHandle,
    otherEmployeeAddress,
    hasAccessToOther,
    employeeCount,
    deployer,
    isDecrypting,
    isRefreshing,
    isAddingSalary,
    isGrantingAccess,
    isViewingOtherSalary,
  };
};

