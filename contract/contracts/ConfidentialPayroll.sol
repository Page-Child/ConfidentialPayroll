// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Confidential Payroll System
/// @notice A secure payroll system using FHEVM for encrypted salary data
contract ConfidentialPayroll is ZamaEthereumConfig {
    // Mapping from employee address to encrypted salary
    mapping(address => euint32) private _salaries;
    
    // Mapping to track if employee exists (to avoid euint32 comparison)
    mapping(address => bool) private _employeeExists;
    
    // Mapping from employee address to authorized viewer addresses
    mapping(address => mapping(address => bool)) private _authorizedViewers;
    
    // Encrypted total salary (sum of all salaries)
    euint32 private _totalSalary;
    
    // Number of employees
    uint256 private _employeeCount;
    
    // Contract deployer address (admin)
    address public immutable deployer;
    
    // Events
    event SalaryAdded(address indexed employee, bool isNewEmployee);
    event AccessGranted(address indexed employee, address indexed viewer);
    event AccessRevoked(address indexed employee, address indexed viewer);
    event StatisticsUpdated(uint256 employeeCount);
    
    /// @notice Constructor that sets the deployer as the admin
    constructor() {
        deployer = msg.sender;
    }
    
    /// @notice Add or update encrypted salary for an employee
    /// @param employeeAddress The address of the employee
    /// @param encryptedSalary The encrypted salary amount
    /// @param proof The proof for the encrypted salary
    function addSalary(
        address employeeAddress,
        externalEuint32 encryptedSalary,
        bytes calldata proof
    ) external {
        euint32 salary = FHE.fromExternal(encryptedSalary, proof);
        
        bool isNewEmployee = !_employeeExists[employeeAddress];
        
        // If this is a new employee, increment count and mark as existing
        if (isNewEmployee) {
            _employeeCount++;
            _employeeExists[employeeAddress] = true;
        } else {
            // If updating existing salary, subtract old salary from total
            euint32 oldSalary = _salaries[employeeAddress];
            _totalSalary = FHE.sub(_totalSalary, oldSalary);
        }
        
        // Add new salary to total
        _totalSalary = FHE.add(_totalSalary, salary);
        
        // Store the salary
        _salaries[employeeAddress] = salary;
        
        // Allow contract to decrypt this salary
        FHE.allowThis(salary);
        FHE.allow(salary, employeeAddress);
        
        // Allow deployer to decrypt total
        FHE.allowThis(_totalSalary);
        FHE.allow(_totalSalary, deployer);
        
        emit SalaryAdded(employeeAddress, isNewEmployee);
        emit StatisticsUpdated(_employeeCount);
    }
    
    /// @notice Get encrypted salary for an employee
    /// @param employeeAddress The address of the employee
    /// @return The encrypted salary
    function getSalary(address employeeAddress) external view returns (euint32) {
        return _salaries[employeeAddress];
    }
    
    /// @notice Grant access to a viewer to decrypt employee's salary
    /// @param viewerAddress The address of the viewer to grant access to
    function grantAccess(address viewerAddress) external {
        require(viewerAddress != address(0), "Invalid viewer address");
        require(viewerAddress != msg.sender, "Cannot grant access to self");
        
        _authorizedViewers[msg.sender][viewerAddress] = true;
        
        // Allow the viewer to decrypt the salary
        if (_employeeExists[msg.sender]) {
            euint32 salary = _salaries[msg.sender];
            FHE.allow(salary, viewerAddress);
        }
        
        emit AccessGranted(msg.sender, viewerAddress);
    }
    
    /// @notice Revoke access from a viewer
    /// @param viewerAddress The address of the viewer to revoke access from
    function revokeAccess(address viewerAddress) external {
        _authorizedViewers[msg.sender][viewerAddress] = false;
        emit AccessRevoked(msg.sender, viewerAddress);
    }
    
    /// @notice Check if a viewer has access to an employee's salary
    /// @param employeeAddress The address of the employee
    /// @param viewerAddress The address of the viewer
    /// @return True if the viewer has access
    function hasAccess(address employeeAddress, address viewerAddress) external view returns (bool) {
        return _authorizedViewers[employeeAddress][viewerAddress];
    }
    
    /// @notice Get encrypted total salary (only deployer can decrypt)
    /// @return The encrypted total salary
    function getTotalSalary() external view returns (euint32) {
        return _totalSalary;
    }
    
    /// @notice Get encrypted average salary
    /// @notice Average can be calculated client-side as totalSalary / employeeCount
    /// @notice This function returns totalSalary and employeeCount for client-side calculation
    /// @return total The encrypted total salary
    /// @return count The number of employees
    function getAverageSalaryData() external view returns (euint32 total, uint256 count) {
        return (_totalSalary, _employeeCount);
    }
    
    /// @notice Get the number of employees
    /// @return The number of employees
    function getEmployeeCount() external view returns (uint256) {
        return _employeeCount;
    }
    
    /// @notice Get contract deployer address
    /// @return The deployer address
    function getDeployer() external view returns (address) {
        return deployer;
    }
}

