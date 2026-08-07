'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Plus, X, Server, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MCPServerStepProps {
  onNext: (data: MCPServerData) => void;
  onBack: () => void;
  onSkip: () => void;
}

export interface MCPServer {
  name: string;
  endpoint: string;
  description?: string;
}

export interface MCPServerData {
  servers: MCPServer[];
  skipConfiguration: boolean;
}

export function MCPServerStep({ onNext, onBack, onSkip }: MCPServerStepProps) {
  const [servers, setServers] = useState<MCPServer[]>([
    { name: '', endpoint: '', description: '' },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    servers.forEach((server, index) => {
      if (server.name.trim() || server.endpoint.trim()) {
        if (!server.name.trim()) {
          newErrors[`name_${index}`] = 'Server name is required';
        }
        if (!server.endpoint.trim()) {
          newErrors[`endpoint_${index}`] = 'Endpoint URL is required';
        } else {
          try {
            new URL(server.endpoint);
          } catch {
            newErrors[`endpoint_${index}`] = 'Invalid URL format';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const validServers = servers.filter(
        (server) => server.name.trim() && server.endpoint.trim()
      );
      onNext({
        servers: validServers,
        skipConfiguration: validServers.length === 0,
      });
    }
  };

  const addServer = () => {
    setServers([...servers, { name: '', endpoint: '', description: '' }]);
  };

  const removeServer = (index: number) => {
    if (servers.length > 1) {
      setServers(servers.filter((_, i) => i !== index));
    }
  };

  const updateServer = (index: number, field: keyof MCPServer, value: string) => {
    setServers(servers.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto"
    >
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <div className="flex items-center mb-2">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-3xl">Configure MCP Servers</CardTitle>
              <CardDescription className="text-base mt-1">
                Connect your Model Context Protocol servers (optional)
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Info Banner */}
          <div className="mb-6 rounded-xl border border-wise-green-primary/30 bg-wise-green-50 p-4">
            <h4 className="mb-2 font-bold text-wise-green-forest">
              What are MCP Servers?
            </h4>
            <p className="text-sm text-wise-gray-700">
              MCP (Model Context Protocol) servers provide additional context and capabilities to AI
              models. You can configure them now or add them later from your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Server List */}
            <div className="space-y-4">
              {servers.map((server, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-4 rounded-xl border border-wise-gray-200 p-4"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-wise-green-forest">
                      Server {index + 1}
                    </h4>
                    {servers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServer(index)}
                        className="text-wise-gray-400 hover:text-red-600 transition-colors"
                        aria-label={`Remove server ${index + 1}`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Server Name */}
                  <div>
                    <label
                      htmlFor={`server-name-${index}`}
                      className="mb-2 block text-sm font-medium text-wise-gray-700"
                    >
                      Server Name
                    </label>
                    <input
                      id={`server-name-${index}`}
                      type="text"
                      value={server.name}
                      onChange={(e) => updateServer(index, 'name', e.target.value)}
                      className={cn('input-wise', errors[`name_${index}`] && 'border-red-500')}
                      placeholder="Production API Server"
                      aria-invalid={!!errors[`name_${index}`]}
                    />
                    {errors[`name_${index}`] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors[`name_${index}`]}
                      </p>
                    )}
                  </div>

                  {/* Endpoint URL */}
                  <div>
                    <label
                      htmlFor={`server-endpoint-${index}`}
                      className="mb-2 block text-sm font-medium text-wise-gray-700"
                    >
                      Endpoint URL
                    </label>
                    <input
                      id={`server-endpoint-${index}`}
                      type="url"
                      value={server.endpoint}
                      onChange={(e) => updateServer(index, 'endpoint', e.target.value)}
                      className={cn('input-wise', errors[`endpoint_${index}`] && 'border-red-500')}
                      placeholder="https://api.example.com/mcp"
                      aria-invalid={!!errors[`endpoint_${index}`]}
                    />
                    {errors[`endpoint_${index}`] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors[`endpoint_${index}`]}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor={`server-description-${index}`}
                      className="mb-2 block text-sm font-medium text-wise-gray-700"
                    >
                      Description (Optional)
                    </label>
                    <input
                      id={`server-description-${index}`}
                      type="text"
                      value={server.description}
                      onChange={(e) => updateServer(index, 'description', e.target.value)}
                      className="input-wise"
                      placeholder="Main production MCP server"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add Server Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addServer}
              icon={<Plus className="h-4 w-4" />}
              className="w-full"
            >
              Add Another Server
            </Button>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onBack} icon={<ArrowLeft />}>
                Back
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={handleSkip}>
                  Skip for Now
                </Button>
                <Button type="submit" icon={<ArrowRight />} iconPosition="right">
                  Continue
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
