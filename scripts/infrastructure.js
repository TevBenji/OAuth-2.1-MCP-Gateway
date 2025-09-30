#!/usr/bin/env node

/**
 * Infrastructure Management Script
 * Manages Terraform infrastructure deployment and configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Terraform configuration
const TERRAFORM_DIR = path.join(__dirname, '..', 'terraform');

/**
 * Initialize Terraform
 */
async function initTerraform() {
  try {
    console.log('🔧 Initializing Terraform...');
    
    process.chdir(TERRAFORM_DIR);
    execSync('terraform init', { stdio: 'inherit' });
    
    console.log('✅ Terraform initialized successfully');
    return { success: true };
  } catch (error) {
    console.error(`❌ Terraform initialization failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Plan Terraform changes
 */
async function planTerraform(environment, options = {}) {
  try {
    console.log(`📋 Planning Terraform changes for ${environment}...`);
    
    const varFile = `${environment}.tfvars`;
    const planFile = `${environment}.tfplan`;
    
    // Check if tfvars file exists
    if (!fs.existsSync(path.join(TERRAFORM_DIR, varFile))) {
      throw new Error(`Variables file not found: ${varFile}`);
    }
    
    process.chdir(TERRAFORM_DIR);
    
    const planCmd = `terraform plan -var-file=${varFile} -out=${planFile}`;
    execSync(planCmd, { stdio: 'inherit' });
    
    console.log(`✅ Terraform plan created: ${planFile}`);
    return { success: true, planFile };
  } catch (error) {
    console.error(`❌ Terraform planning failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Apply Terraform changes
 */
async function applyTerraform(environment, options = {}) {
  try {
    console.log(`🚀 Applying Terraform changes for ${environment}...`);
    
    const planFile = `${environment}.tfplan`;
    
    // Check if plan file exists
    if (!fs.existsSync(path.join(TERRAFORM_DIR, planFile))) {
      console.log('No plan file found, creating one...');
      const planResult = await planTerraform(environment, options);
      if (!planResult.success) {
        throw new Error('Failed to create plan');
      }
    }
    
    process.chdir(TERRAFORM_DIR);
    
    const applyCmd = options.autoApprove 
      ? `terraform apply -auto-approve ${planFile}`
      : `terraform apply ${planFile}`;
      
    execSync(applyCmd, { stdio: 'inherit' });
    
    console.log(`✅ Terraform changes applied for ${environment}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Terraform apply failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Destroy Terraform infrastructure
 */
async function destroyTerraform(environment, options = {}) {
  try {
    if (environment === 'production' && !options.force) {
      throw new Error('Cannot destroy production infrastructure without --force flag');
    }
    
    console.log(`💥 Destroying Terraform infrastructure for ${environment}...`);
    
    const varFile = `${environment}.tfvars`;
    
    process.chdir(TERRAFORM_DIR);
    
    const destroyCmd = options.autoApprove
      ? `terraform destroy -var-file=${varFile} -auto-approve`
      : `terraform destroy -var-file=${varFile}`;
      
    execSync(destroyCmd, { stdio: 'inherit' });
    
    console.log(`✅ Terraform infrastructure destroyed for ${environment}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Terraform destroy failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Show Terraform state
 */
async function showTerraformState(environment) {
  try {
    console.log(`📊 Showing Terraform state for ${environment}...`);
    
    process.chdir(TERRAFORM_DIR);
    execSync('terraform show', { stdio: 'inherit' });
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to show Terraform state: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Validate Terraform configuration
 */
async function validateTerraform() {
  try {
    console.log('🔍 Validating Terraform configuration...');
    
    process.chdir(TERRAFORM_DIR);
    execSync('terraform validate', { stdio: 'inherit' });
    
    console.log('✅ Terraform configuration is valid');
    return { success: true };
  } catch (error) {
    console.error(`❌ Terraform validation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Format Terraform files
 */
async function formatTerraform() {
  try {
    console.log('🎨 Formatting Terraform files...');
    
    process.chdir(TERRAFORM_DIR);
    execSync('terraform fmt -recursive', { stdio: 'inherit' });
    
    console.log('✅ Terraform files formatted');
    return { success: true };
  } catch (error) {
    console.error(`❌ Terraform formatting failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Get Terraform outputs
 */
async function getTerraformOutputs(environment) {
  try {
    console.log(`📤 Getting Terraform outputs for ${environment}...`);
    
    process.chdir(TERRAFORM_DIR);
    const outputs = execSync('terraform output -json', { encoding: 'utf8' });
    
    const parsedOutputs = JSON.parse(outputs);
    console.log('Terraform Outputs:');
    console.log(JSON.stringify(parsedOutputs, null, 2));
    
    return { success: true, outputs: parsedOutputs };
  } catch (error) {
    console.error(`❌ Failed to get Terraform outputs: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1] || 'development';
  const options = {};
  
  // Parse options
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--auto-approve') {
      options.autoApprove = true;
    } else if (args[i] === '--force') {
      options.force = true;
    }
  }
  
  switch (command) {
    case 'init':
      return await initTerraform();
    case 'plan':
      return await planTerraform(environment, options);
    case 'apply':
      return await applyTerraform(environment, options);
    case 'destroy':
      return await destroyTerraform(environment, options);
    case 'show':
      return await showTerraformState(environment);
    case 'validate':
      return await validateTerraform();
    case 'format':
      return await formatTerraform();
    case 'outputs':
      return await getTerraformOutputs(environment);
    case 'help':
    default:
      console.log(`
Infrastructure Management Tool

Usage:
  init                          Initialize Terraform
  plan [environment]            Plan infrastructure changes
  apply [environment] [options] Apply infrastructure changes
  destroy [environment] [options] Destroy infrastructure
  show [environment]            Show current state
  validate                      Validate Terraform configuration
  format                        Format Terraform files
  outputs [environment]         Show Terraform outputs
  help                          Show this help

Environments:
  development    Development environment (default)
  staging        Staging environment
  production     Production environment

Options:
  --auto-approve    Skip interactive approval
  --force           Force operation (required for production destroy)

Examples:
  init
  plan staging
  apply production --auto-approve
  destroy development --force
  outputs production
      `);
      process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(result => {
    if (result && !result.success) {
      process.exit(1);
    }
  });
}

module.exports = {
  initTerraform,
  planTerraform,
  applyTerraform,
  destroyTerraform,
  showTerraformState,
  validateTerraform,
  formatTerraform,
  getTerraformOutputs
};