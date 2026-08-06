"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Form data structure for project creation
 */
interface ProjectFormData {
  name: string;
  description: string;
  environment: "development" | "staging" | "production";
  redirectUrls: string[];
  allowedOrigins: string[];
  tokenLifetime: number; // in seconds
  refreshTokenLifetime: number; // in seconds
  enablePKCE: boolean;
  enableRefreshTokens: boolean;
  enableClientCredentials: boolean;
}

/**
 * Form validation errors
 */
interface FormErrors {
  name?: string;
  description?: string;
  redirectUrls?: string;
  allowedOrigins?: string;
  tokenLifetime?: string;
  refreshTokenLifetime?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NewProjectPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    environment: "development",
    redirectUrls: [""],
    allowedOrigins: [""],
    tokenLifetime: 3600, // 1 hour
    refreshTokenLifetime: 2592000, // 30 days
    enablePKCE: true,
    enableRefreshTokens: true,
    enableClientCredentials: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // ============================================================================
  // CONVEX MUTATIONS
  // ============================================================================

  /**
   * Create new project mutation
   * Real implementation: api.projects.createProject
   */
  const createProject = useMutation(api.projects.createProject);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate form data for current step
   */
  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      // Step 1: Basic Information
      if (!formData.name.trim()) {
        newErrors.name = "Project name is required";
      } else if (formData.name.length < 3) {
        newErrors.name = "Project name must be at least 3 characters";
      } else if (formData.name.length > 100) {
        newErrors.name = "Project name must not exceed 100 characters";
      }

      if (formData.description.length > 500) {
        newErrors.description = "Description must not exceed 500 characters";
      }
    } else if (step === 2) {
      // Step 2: OAuth Configuration
      const validUrls = formData.redirectUrls.filter((url) => url.trim());
      if (validUrls.length === 0) {
        newErrors.redirectUrls = "At least one redirect URL is required";
      } else {
        // Validate URL format
        for (const url of validUrls) {
          try {
            new URL(url);
          } catch {
            newErrors.redirectUrls = `Invalid URL format: ${url}`;
            break;
          }
        }
      }

      const validOrigins = formData.allowedOrigins.filter((origin) => origin.trim());
      if (validOrigins.length > 0) {
        for (const origin of validOrigins) {
          try {
            new URL(origin);
          } catch {
            newErrors.allowedOrigins = `Invalid origin format: ${origin}`;
            break;
          }
        }
      }
    } else if (step === 3) {
      // Step 3: Security Settings
      if (formData.tokenLifetime < 60) {
        newErrors.tokenLifetime = "Token lifetime must be at least 60 seconds";
      } else if (formData.tokenLifetime > 86400) {
        newErrors.tokenLifetime = "Token lifetime must not exceed 24 hours (86400 seconds)";
      }

      if (formData.enableRefreshTokens) {
        if (formData.refreshTokenLifetime < 3600) {
          newErrors.refreshTokenLifetime =
            "Refresh token lifetime must be at least 1 hour (3600 seconds)";
        } else if (formData.refreshTokenLifetime > 31536000) {
          newErrors.refreshTokenLifetime =
            "Refresh token lifetime must not exceed 1 year (31536000 seconds)";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateStep(3) || !user) return;

    setIsSubmitting(true);

    try {
      // Filter out empty URLs and origins
      const cleanedData = {
        ...formData,
        redirectUrls: formData.redirectUrls.filter((url) => url.trim()),
        allowedOrigins: formData.allowedOrigins.filter((origin) => origin.trim()),
      };

      const newProject = await createProject({
        ...cleanedData,
        userId: user.id,
      });

      // Redirect to project page
      router.push(`/dashboard/projects/${newProject._id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Navigate to next step
   */
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(3, prev + 1) as 1 | 2 | 3);
    }
  };

  /**
   * Navigate to previous step
   */
  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3);
  };

  /**
   * Add a new redirect URL input field
   */
  const addRedirectUrl = () => {
    setFormData({
      ...formData,
      redirectUrls: [...formData.redirectUrls, ""],
    });
  };

  /**
   * Remove a redirect URL input field
   */
  const removeRedirectUrl = (index: number) => {
    setFormData({
      ...formData,
      redirectUrls: formData.redirectUrls.filter((_, i) => i !== index),
    });
  };

  /**
   * Update a specific redirect URL
   */
  const updateRedirectUrl = (index: number, value: string) => {
    const newUrls = [...formData.redirectUrls];
    newUrls[index] = value;
    setFormData({ ...formData, redirectUrls: newUrls });
    if (errors.redirectUrls) {
      setErrors({ ...errors, redirectUrls: undefined });
    }
  };

  /**
   * Add a new allowed origin input field
   */
  const addAllowedOrigin = () => {
    setFormData({
      ...formData,
      allowedOrigins: [...formData.allowedOrigins, ""],
    });
  };

  /**
   * Remove an allowed origin input field
   */
  const removeAllowedOrigin = (index: number) => {
    setFormData({
      ...formData,
      allowedOrigins: formData.allowedOrigins.filter((_, i) => i !== index),
    });
  };

  /**
   * Update a specific allowed origin
   */
  const updateAllowedOrigin = (index: number, value: string) => {
    const newOrigins = [...formData.allowedOrigins];
    newOrigins[index] = value;
    setFormData({ ...formData, allowedOrigins: newOrigins });
    if (errors.allowedOrigins) {
      setErrors({ ...errors, allowedOrigins: undefined });
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (!isLoaded) {
    return (
      <div className="p-6 space-y-6">
        <NewProjectSkeleton />
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 text-wise-gray-600 hover:text-wise-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Projects</span>
        </Link>
        <h1 className="text-3xl font-bold text-wise-gray-900">Create New Project</h1>
        <p className="text-wise-gray-600 mt-1">
          Set up a new OAuth 2.1 project for your application
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="card-wise p-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step < currentStep
                      ? "bg-wise-green-primary text-white"
                      : step === currentStep
                      ? "bg-wise-green-primary text-white"
                      : "bg-wise-gray-200 text-wise-gray-600"
                  }`}
                >
                  {step < currentStep ? <Check className="w-6 h-6" /> : step}
                </div>
                <div className="ml-3 hidden md:block">
                  <p
                    className={`text-sm font-medium ${
                      step <= currentStep ? "text-wise-gray-900" : "text-wise-gray-500"
                    }`}
                  >
                    {step === 1
                      ? "Basic Info"
                      : step === 2
                      ? "OAuth Config"
                      : "Security"}
                  </p>
                </div>
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    step < currentStep ? "bg-wise-green-primary" : "bg-wise-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="card-wise p-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-wise-gray-900 mb-4">
                Basic Information
              </h2>

              {/* Project Name */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="project-name"
                    className="block text-sm font-medium text-wise-gray-700 mb-1"
                  >
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="project-name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) {
                        setErrors({ ...errors, name: undefined });
                      }
                    }}
                    placeholder="e.g., My Awesome App"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary ${
                      errors.name ? "border-red-500" : "border-wise-gray-300"
                    }`}
                    maxLength={100}
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                  <p className="text-xs text-wise-gray-600 mt-1">
                    {formData.name.length}/100 characters
                  </p>
                </div>

                {/* Project Description */}
                <div>
                  <label
                    htmlFor="project-description"
                    className="block text-sm font-medium text-wise-gray-700 mb-1"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="project-description"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description) {
                        setErrors({ ...errors, description: undefined });
                      }
                    }}
                    placeholder="Describe your project and its purpose..."
                    rows={4}
                    maxLength={500}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary resize-none ${
                      errors.description ? "border-red-500" : "border-wise-gray-300"
                    }`}
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? "description-error" : undefined}
                  />
                  {errors.description && (
                    <p id="description-error" className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.description}
                    </p>
                  )}
                  <p className="text-xs text-wise-gray-600 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Environment Selection */}
                <div>
                  <label
                    htmlFor="environment"
                    className="block text-sm font-medium text-wise-gray-700 mb-1"
                  >
                    Environment *
                  </label>
                  <select
                    id="environment"
                    value={formData.environment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        environment: e.target.value as ProjectFormData["environment"],
                      })
                    }
                    className="w-full px-3 py-2 border border-wise-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      <strong>Development:</strong> For local testing and development<br />
                      <strong>Staging:</strong> For pre-production testing<br />
                      <strong>Production:</strong> For live applications
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: OAuth Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-wise-gray-900 mb-4">
                OAuth 2.1 Configuration
              </h2>

              {/* Redirect URLs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-wise-gray-700 mb-2">
                    Redirect URLs *
                  </label>
                  <p className="text-sm text-wise-gray-600 mb-3">
                    Add the URLs where users will be redirected after authentication
                  </p>

                  <div className="space-y-2">
                    {formData.redirectUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => updateRedirectUrl(index, e.target.value)}
                          placeholder="https://example.com/callback"
                          className="flex-1 px-3 py-2 border border-wise-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary"
                        />
                        {formData.redirectUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRedirectUrl(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove redirect URL"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {errors.redirectUrls && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.redirectUrls}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={addRedirectUrl}
                    className="mt-2 text-sm text-wise-green-primary hover:text-wise-green-primary/80 font-medium"
                  >
                    + Add Another URL
                  </button>
                </div>

                {/* Allowed Origins */}
                <div>
                  <label className="block text-sm font-medium text-wise-gray-700 mb-2">
                    Allowed Origins (Optional)
                  </label>
                  <p className="text-sm text-wise-gray-600 mb-3">
                    Add origins that are allowed to make CORS requests (for web apps)
                  </p>

                  <div className="space-y-2">
                    {formData.allowedOrigins.map((origin, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={origin}
                          onChange={(e) => updateAllowedOrigin(index, e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 px-3 py-2 border border-wise-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary"
                        />
                        {formData.allowedOrigins.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAllowedOrigin(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove allowed origin"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {errors.allowedOrigins && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.allowedOrigins}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={addAllowedOrigin}
                    className="mt-2 text-sm text-wise-green-primary hover:text-wise-green-primary/80 font-medium"
                  >
                    + Add Another Origin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Security Settings */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-wise-gray-900 mb-4">
                Security Settings
              </h2>

              <div className="space-y-6">
                {/* Token Lifetime */}
                <div>
                  <label
                    htmlFor="token-lifetime"
                    className="block text-sm font-medium text-wise-gray-700 mb-1"
                  >
                    Access Token Lifetime (seconds) *
                  </label>
                  <input
                    type="number"
                    id="token-lifetime"
                    value={formData.tokenLifetime}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        tokenLifetime: parseInt(e.target.value) || 0,
                      });
                      if (errors.tokenLifetime) {
                        setErrors({ ...errors, tokenLifetime: undefined });
                      }
                    }}
                    min={60}
                    max={86400}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary ${
                      errors.tokenLifetime ? "border-red-500" : "border-wise-gray-300"
                    }`}
                  />
                  {errors.tokenLifetime && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.tokenLifetime}
                    </p>
                  )}
                  <p className="text-xs text-wise-gray-600 mt-1">
                    Recommended: 3600 seconds (1 hour)
                  </p>
                </div>

                {/* OAuth Features */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-wise-gray-700">OAuth 2.1 Features</h3>

                  {/* PKCE */}
                  <label className="flex items-start gap-3 p-4 border border-wise-gray-200 rounded-lg hover:bg-wise-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enablePKCE}
                      onChange={(e) =>
                        setFormData({ ...formData, enablePKCE: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-wise-green-primary border-wise-gray-300 rounded focus:ring-wise-green-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-wise-gray-900">
                        Enable PKCE (Recommended)
                      </p>
                      <p className="text-sm text-wise-gray-600 mt-1">
                        Proof Key for Code Exchange adds an extra security layer for public
                        clients
                      </p>
                    </div>
                  </label>

                  {/* Refresh Tokens */}
                  <label className="flex items-start gap-3 p-4 border border-wise-gray-200 rounded-lg hover:bg-wise-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableRefreshTokens}
                      onChange={(e) =>
                        setFormData({ ...formData, enableRefreshTokens: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-wise-green-primary border-wise-gray-300 rounded focus:ring-wise-green-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-wise-gray-900">
                        Enable Refresh Tokens
                      </p>
                      <p className="text-sm text-wise-gray-600 mt-1">
                        Allow clients to obtain new access tokens without re-authentication
                      </p>
                    </div>
                  </label>

                  {/* Refresh Token Lifetime */}
                  {formData.enableRefreshTokens && (
                    <div className="ml-12">
                      <label
                        htmlFor="refresh-lifetime"
                        className="block text-sm font-medium text-wise-gray-700 mb-1"
                      >
                        Refresh Token Lifetime (seconds)
                      </label>
                      <input
                        type="number"
                        id="refresh-lifetime"
                        value={formData.refreshTokenLifetime}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            refreshTokenLifetime: parseInt(e.target.value) || 0,
                          });
                          if (errors.refreshTokenLifetime) {
                            setErrors({ ...errors, refreshTokenLifetime: undefined });
                          }
                        }}
                        min={3600}
                        max={31536000}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary ${
                          errors.refreshTokenLifetime
                            ? "border-red-500"
                            : "border-wise-gray-300"
                        }`}
                      />
                      {errors.refreshTokenLifetime && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.refreshTokenLifetime}
                        </p>
                      )}
                      <p className="text-xs text-wise-gray-600 mt-1">
                        Recommended: 2592000 seconds (30 days)
                      </p>
                    </div>
                  )}

                  {/* Client Credentials */}
                  <label className="flex items-start gap-3 p-4 border border-wise-gray-200 rounded-lg hover:bg-wise-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableClientCredentials}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enableClientCredentials: e.target.checked,
                        })
                      }
                      className="mt-1 w-4 h-4 text-wise-green-primary border-wise-gray-300 rounded focus:ring-wise-green-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-wise-gray-900">
                        Enable Client Credentials Grant
                      </p>
                      <p className="text-sm text-wise-gray-600 mt-1">
                        For server-to-server authentication (machine-to-machine)
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-wise-gray-200 mt-6">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="btn-wise-secondary px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="btn-wise-primary px-6 py-2 rounded-lg"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-wise-primary px-6 py-2 rounded-lg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Project</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/**
 * Loading skeleton
 */
function NewProjectSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-32 bg-wise-gray-200 rounded animate-pulse" />
        <div className="h-8 w-64 bg-wise-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-wise-gray-200 rounded animate-pulse" />
      </div>

      <div className="card-wise p-6">
        <div className="h-10 w-full bg-wise-gray-200 rounded animate-pulse" />
      </div>

      <div className="card-wise p-6 space-y-4">
        <div className="h-6 w-48 bg-wise-gray-200 rounded animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-wise-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-wise-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
