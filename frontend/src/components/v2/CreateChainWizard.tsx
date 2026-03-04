import { useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check,
  Network, Settings, Wallet, Shield, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/components/ui/utils';

interface CreateChainWizardProps {
  onClose: () => void;
  onComplete: (data: any) => void;
}

export function CreateChainWizard({ onClose, onComplete }: CreateChainWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    chainName: '',
    chainId: '',
    networkType: 'mainnet',
    description: '',

    // Step 2: Consensus
    consensusMechanism: 'pos',
    blockTime: '2',
    gasLimit: '8000000',

    // Step 3: Token Economics
    tokenName: '',
    tokenSymbol: '',
    initialSupply: '',

    // Step 4: Validators
    minValidators: '4',
    stakeAmount: '2000',

    // Step 5: Network Config
    vmType: 'evm',
    rpcPort: '9650',
    httpPort: '9651',
  });

  const steps = [
    {
      id: 0,
      title: 'Basic Information',
      icon: Network,
      description: 'Define your blockchain identity'
    },
    {
      id: 1,
      title: 'Consensus Settings',
      icon: Settings,
      description: 'Configure consensus mechanism'
    },
    {
      id: 2,
      title: 'Token Economics',
      icon: Wallet,
      description: 'Set up your native token'
    },
    {
      id: 3,
      title: 'Validator Setup',
      icon: Shield,
      description: 'Configure validator requirements'
    },
    {
      id: 4,
      title: 'Network Configuration',
      icon: Zap,
      description: 'Finalize network settings'
    },
  ];

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(formData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="chainName">Blockchain Name *</Label>
              <Input
                id="chainName"
                value={formData.chainName}
                onChange={(e) => updateFormData('chainName', e.target.value)}
                placeholder="e.g., MyDeFi Chain"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A unique name for your blockchain
              </p>
            </div>

            <div>
              <Label htmlFor="chainId">Chain ID *</Label>
              <Input
                id="chainId"
                value={formData.chainId}
                onChange={(e) => updateFormData('chainId', e.target.value)}
                placeholder="e.g., 12345"
                type="number"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique identifier for your chain (must be unique across networks)
              </p>
            </div>

            <div>
              <Label htmlFor="networkType">Network Type *</Label>
              <Select
                value={formData.networkType}
                onValueChange={(value) => updateFormData('networkType', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mainnet">Mainnet (Production)</SelectItem>
                  <SelectItem value="testnet">Testnet (Testing)</SelectItem>
                  <SelectItem value="local">Local Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe your blockchain's purpose and use case..."
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="consensusMechanism">Consensus Mechanism *</Label>
              <Select
                value={formData.consensusMechanism}
                onValueChange={(value) => updateFormData('consensusMechanism', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pos">Proof of Stake (PoS)</SelectItem>
                  <SelectItem value="poa">Proof of Authority (PoA)</SelectItem>
                  <SelectItem value="avalanche">Avalanche Consensus</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Choose the consensus algorithm for block validation
              </p>
            </div>

            <div>
              <Label htmlFor="blockTime">Block Time (seconds) *</Label>
              <Input
                id="blockTime"
                value={formData.blockTime}
                onChange={(e) => updateFormData('blockTime', e.target.value)}
                type="number"
                step="0.1"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Average time between blocks (recommended: 2-5 seconds)
              </p>
            </div>

            <div>
              <Label htmlFor="gasLimit">Gas Limit per Block *</Label>
              <Input
                id="gasLimit"
                value={formData.gasLimit}
                onChange={(e) => updateFormData('gasLimit', e.target.value)}
                type="number"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum gas that can be used in a single block
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Tip:</strong> For high-throughput applications, consider shorter block times and higher gas limits.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="tokenName">Native Token Name *</Label>
              <Input
                id="tokenName"
                value={formData.tokenName}
                onChange={(e) => updateFormData('tokenName', e.target.value)}
                placeholder="e.g., MyChain Token"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="tokenSymbol">Token Symbol *</Label>
              <Input
                id="tokenSymbol"
                value={formData.tokenSymbol}
                onChange={(e) => updateFormData('tokenSymbol', e.target.value.toUpperCase())}
                placeholder="e.g., MCT"
                maxLength={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                3-5 characters, typically uppercase
              </p>
            </div>

            <div>
              <Label htmlFor="initialSupply">Initial Supply *</Label>
              <Input
                id="initialSupply"
                value={formData.initialSupply}
                onChange={(e) => updateFormData('initialSupply', e.target.value)}
                type="number"
                placeholder="e.g., 1000000000"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total tokens to be minted at genesis
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                ⚠️ <strong>Important:</strong> Token economics cannot be changed after deployment. Plan carefully!
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="minValidators">Minimum Validators *</Label>
              <Input
                id="minValidators"
                value={formData.minValidators}
                onChange={(e) => updateFormData('minValidators', e.target.value)}
                type="number"
                min="1"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum number of validators required to secure the network
              </p>
            </div>

            <div>
              <Label htmlFor="stakeAmount">Minimum Stake Amount *</Label>
              <Input
                id="stakeAmount"
                value={formData.stakeAmount}
                onChange={(e) => updateFormData('stakeAmount', e.target.value)}
                type="number"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum tokens required to become a validator (in {formData.tokenSymbol || 'tokens'})
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h4 className="text-sm">Validator Requirements Summary</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Min Validators:</span>
                  <span className="text-foreground">{formData.minValidators || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stake Required:</span>
                  <span className="text-foreground">{formData.stakeAmount || '0'} {formData.tokenSymbol || 'tokens'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Consensus:</span>
                  <span className="text-foreground capitalize">{formData.consensusMechanism}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="vmType">Virtual Machine Type *</Label>
              <Select
                value={formData.vmType}
                onValueChange={(value) => updateFormData('vmType', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evm">EVM (Ethereum Virtual Machine)</SelectItem>
                  <SelectItem value="wasm">WASM (WebAssembly)</SelectItem>
                  <SelectItem value="custom">Custom VM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rpcPort">RPC Port *</Label>
                <Input
                  id="rpcPort"
                  value={formData.rpcPort}
                  onChange={(e) => updateFormData('rpcPort', e.target.value)}
                  type="number"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="httpPort">HTTP Port *</Label>
                <Input
                  id="httpPort"
                  value={formData.httpPort}
                  onChange={(e) => updateFormData('httpPort', e.target.value)}
                  type="number"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4">
              <h4>Configuration Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Blockchain Name</p>
                  <p className="text-foreground mt-1">{formData.chainName || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Chain ID</p>
                  <p className="text-foreground mt-1">{formData.chainId || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Native Token</p>
                  <p className="text-foreground mt-1">{formData.tokenSymbol || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Block Time</p>
                  <p className="text-foreground mt-1">{formData.blockTime}s</p>
                </div>
                <div>
                  <p className="text-muted-foreground">VM Type</p>
                  <p className="text-foreground mt-1 uppercase">{formData.vmType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Min Validators</p>
                  <p className="text-foreground mt-1">{formData.minValidators}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✅ Ready to deploy! Review your configuration and click "Create Blockchain" to proceed.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-semibold">Create New Blockchain</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Step {currentStep + 1} of {steps.length} • Quick Setup
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 flex justify-between items-center text-xs">
            <span className="text-blue-600 dark:text-blue-400">
              Creating a new Subnet with a single Blockchain.
            </span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-blue-600 dark:text-blue-400 font-semibold"
              onClick={() => {
                onClose();
                // Optional: You could trigger navigation effectively here if passed down
                (window as any).location.href = '/?view=subnets';
              }}
            >
              Need advanced config? Go to Subnet Manager &rarr;
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      isCompleted && 'bg-green-500 text-white',
                      isCurrent && 'bg-primary text-primary-foreground',
                      !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                    )}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <p className={cn(
                      'text-xs mt-2 text-center hidden md:block',
                      isCurrent && 'text-foreground',
                      !isCurrent && 'text-muted-foreground'
                    )}>
                      {step.title}
                    </p>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={cn(
                      'h-0.5 flex-1 mx-2',
                      idx < currentStep ? 'bg-green-500' : 'bg-border'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3>{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {steps[currentStep].description}
            </p>
          </div>
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" />
              Create Blockchain
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
