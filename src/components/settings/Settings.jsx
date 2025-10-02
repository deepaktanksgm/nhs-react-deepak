"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Save, RotateCcw, Eye, EyeOff, Copy, Loader2, Lock, X } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"

// Simple encryption utility (for demo purposes - use proper encryption in production)
const encryptPassword = (password) => {
  return btoa(password) // Base64 encoding - replace with proper encryption
}

const PasswordModal = ({ isOpen, onClose, onConfirm, loading, title = "Password Required", message = "Please enter your password to continue." }) => {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password.trim()) {
      onConfirm(password)
      setPassword("")
    }
  }

  const handleClose = () => {
    setPassword("")
    setShowPassword(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            {message}
          </p>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter password"
              autoFocus
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="flex items-center justify-end space-x-3 mt-6">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="text-white"
              style={{ backgroundColor: "#10B981" }}
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Setting = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("ai-prompt")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showLoadPasswordModal, setShowLoadPasswordModal] = useState(false)

  // Use ref to track if data has been fetched
  const dataFetched = useRef(false)
  const [settingsDataState, setSettingsDataState] = useState({
    base_sysm_policy: "",
    default_message: "",
  })
  const [environmentSetting, setEnvironmentSetting] = useState({
    "AZURE_OPENAI_ENDPOINT": "",
    "AZURE_OPENAI_API_KEY": "",
    "AZURE_OPENAI_DEPLOYMENT_NAME": "",
    "AZURE_SEARCH_ENDPOINT": "",
    "AZURE_SEARCH_KEY": "",
    "AZURE_SEARCH_INDEX_NAME": "",
    "AZURE_OPENAI_EMBEDDING_MODEL": "",
    "AZURE_SEARCH_SEMANTIC_CONFIG": ""
  })
  const [originalSettings, setOriginalSettings] = useState({})
  const [originalEnvironment, setOriginalEnvironment] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Memoized fetch function with password verification
  const fetchSettings = useCallback(async (password) => {
    try {
      setInitialLoading(true)

      // Send password with the request
      const response = await fetch(`${API_BASE_URL}/getSetting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: encryptPassword(password)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = (await response.json()).data || {}

      // Handle nested structure - extract from system object if it exists
      const systemData = data.system || data
      const envData = data.environment || {}

      const loadedData = {
        base_sysm_policy: systemData.base_sysm_policy || "",
        default_message: systemData.default_message || "",
      }

      const loadedEnvData = {
        "AZURE_OPENAI_ENDPOINT": envData.AZURE_OPENAI_ENDPOINT || "",
        "AZURE_OPENAI_API_KEY": envData.AZURE_OPENAI_API_KEY || "",
        "AZURE_OPENAI_DEPLOYMENT_NAME": envData.AZURE_OPENAI_DEPLOYMENT_NAME || "",
        "AZURE_SEARCH_ENDPOINT": envData.AZURE_SEARCH_ENDPOINT || "",
        "AZURE_SEARCH_KEY": envData.AZURE_SEARCH_KEY || "",
        "AZURE_SEARCH_INDEX_NAME": envData.AZURE_SEARCH_INDEX_NAME || "",
        "AZURE_OPENAI_EMBEDDING_MODEL": envData.AZURE_OPENAI_EMBEDDING_MODEL || "",
        "AZURE_SEARCH_SEMANTIC_CONFIG": envData.AZURE_SEARCH_SEMANTIC_CONFIG || ""
      }

      // Batch state updates to prevent multiple re-renders
      setSettingsDataState(loadedData)
      setOriginalSettings(loadedData)
      setEnvironmentSetting(loadedEnvData)
      setOriginalEnvironment(loadedEnvData)
      setShowLoadPasswordModal(false)
      dataFetched.current = true

      toast.success("Settings loaded successfully!", {
        duration: 2000
      })

    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error(error.message || "Failed to load settings from server", {
        duration: 4000
      })
      //setShowLoadPasswordModal(false)
    } finally {
      setInitialLoading(false)
    }
  }, [API_BASE_URL])

  // Handle opening modal - show password prompt first
  const handleOpenModal = () => {
    setIsOpen(true)
    if (!dataFetched.current) {
      setShowLoadPasswordModal(true)
    }
  }

  // Handle password confirmation for loading settings
  const handleLoadWithPassword = async (password) => {
    await fetchSettings(password)
  }

  // Check for unsaved changes - memoized to prevent unnecessary re-renders
  useEffect(() => {
    const hasChanges = (JSON.stringify(settingsDataState) !== JSON.stringify(originalSettings) ||
      JSON.stringify(environmentSetting) !== JSON.stringify(originalEnvironment))
    setHasUnsavedChanges(hasChanges)
  }, [settingsDataState, originalSettings, environmentSetting, originalEnvironment])

  // Handle input changes for settings data
  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setSettingsDataState(prev => ({ ...prev, [name]: value }))
  }, [])

  // Handle input changes for environment settings
  const handleEnvironmentChange = useCallback((e) => {
    const { name, value } = e.target
    setEnvironmentSetting(prev => ({ ...prev, [name]: value }))
  }, [])

  // Save settings to API with password verification
  const handleSaveWithPassword = async (password) => {
    try {
      setLoading(true)
      const payload = {
        setting: {
          system: {
            base_sysm_policy: settingsDataState.base_sysm_policy,
            default_message: settingsDataState.default_message
          },
          environment: environmentSetting
        },
        password: encryptPassword(password) // Encrypt password before sending
      }

      const response = await fetch(`${API_BASE_URL}/updateSetting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`)
      }

      setOriginalSettings(settingsDataState)
      setOriginalEnvironment(environmentSetting)
      setHasUnsavedChanges(false)
      setShowPasswordModal(false) // Close password modal on success

      toast.success("Settings saved successfully!", {
        duration: 3000
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error(error.message || "Failed to save settings. Please try again.", {
        duration: 4000
      })
      //setShowPasswordModal(false) // Close password modal on other errors
    } finally {
      setLoading(false)
    }
  }

  // Trigger save process (show password modal)
  const handleSave = () => {
    setShowPasswordModal(true)
  }

  // Reset to original settings
  const handleReset = useCallback(() => {
    setSettingsDataState(originalSettings)
    setEnvironmentSetting(originalEnvironment)
    toast.success("Settings reset to last saved version", {
      duration: 2000
    })
  }, [originalSettings, originalEnvironment])

  // Reset to default settings
  const handleResetToDefaults = useCallback(() => {
    const defaultData = {
      base_sysm_policy: "You are a helpful NHS policy assistant. The user is greeting you or asking a simple question. Respond in a friendly, professional manner and use UK English. Let the user know you can help with NHS policy questions.",
      default_message: "Hello, I'm your NHS Policy Assistant. I'm here 24/7 to provide information and support. How can I help you today?"
    }

    const defaultEnvData = {
      "AZURE_OPENAI_ENDPOINT": "",
      "AZURE_OPENAI_API_KEY": "",
      "AZURE_OPENAI_DEPLOYMENT_NAME": "",
      "AZURE_SEARCH_ENDPOINT": "",
      "AZURE_SEARCH_KEY": "",
      "AZURE_SEARCH_INDEX_NAME": "",
      "AZURE_OPENAI_EMBEDDING_MODEL": "",
      "AZURE_SEARCH_SEMANTIC_CONFIG": ""
    }

    setSettingsDataState(defaultData)
    setEnvironmentSetting(defaultEnvData)

    toast.success("Settings reset to default values", {
      duration: 2000
    })
  }, [])

  const toReadableLabel = (str) =>
    str
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const [visibleFields, setVisibleFields] = useState({});
  const [copiedField, setCopiedField] = useState("");

  const toggleVisibility = useCallback((key) => {
    setVisibleFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const handleCopy = useCallback((key, value) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(""), 1500);
  }, []);

  // Handle modal close - reset fetch flag if needed
  const handleClose = useCallback(() => {
    setIsOpen(false)
    setShowPasswordModal(false)
    setShowLoadPasswordModal(false)
    // Optionally reset the fetch flag if you want to re-fetch on next open
    // dataFetched.current = false
  }, [])

  return (
    <>
      <Button
        onClick={handleOpenModal}
        className="ml-4 text-white"
        style={{ backgroundColor: "#005eb8" }}
        disabled={initialLoading}
      >
        {initialLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Settings className="w-5 h-5" />
        )}
      </Button>

      {/* Password Modal for Loading Settings */}
      <PasswordModal
        isOpen={showLoadPasswordModal}
        //onClose={() => setShowLoadPasswordModal(false)}
        onClose={handleClose}
        onConfirm={handleLoadWithPassword}
        loading={initialLoading}
        title="Access Settings"
        message="Please enter your password to load the settings."
      />

      {/* Password Modal for Saving Settings */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handleSaveWithPassword}
        loading={loading}
        title="Save Settings"
        message="Please enter your password to save the settings changes."
      />

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[700px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderBottomColor: "#d8dde0" }}>
              <div>
                <h3 className="text-xl font-semibold" style={{ color: "#212b32" }}>
                  Settings
                </h3>
                <p className="text-sm text-gray-600">
                  Configure AI prompts and environment variables for your application.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {hasUnsavedChanges && (
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50 bg-transparent"
                      disabled={loading}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="text-white shadow-md hover:shadow-lg transition-all"
                      style={{ backgroundColor: "#10B981" }}
                      disabled={loading}
                    >
                      <Lock className="w-4 h-4 mr-1" />
                      Save Changes
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  style={{ color: "#4c6272" }}
                  className="hover:bg-gray-100"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && (
              <div className="hidden px-6 py-2 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-yellow-800">You have unsaved changes</span>
                  </div>
                  <Button
                    onClick={handleResetToDefaults}
                    variant="ghost"
                    size="sm"
                    className="text-yellow-700 hover:bg-yellow-100 text-xs"
                    disabled={loading}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b" style={{ borderBottomColor: "#d8dde0" }}>
              <button
                onClick={() => setActiveTab("ai-prompt")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "ai-prompt"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                style={activeTab === "ai-prompt" ? { borderBottomColor: "#005eb8", color: "#005eb8" } : {}}
              >
                AI Prompt Settings
              </button>
              <button
                onClick={() => setActiveTab("environment")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "environment"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                style={activeTab === "environment" ? { borderBottomColor: "#005eb8", color: "#005eb8" } : {}}
              >
                Environment Variables
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {initialLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading settings...</span>
                  </div>
                </div>
              ) : !dataFetched.current ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-600">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Authentication Required</p>
                    <p className="text-sm">Please enter your password to view settings.</p>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === "ai-prompt" && (
                    <div className="space-y-6">
                      {/* System Policy */}
                      <div>
                        <h4 className="text-lg font-semibold mb-2" style={{ color: "#212b32" }}>
                          System Policy
                        </h4>
                        <textarea
                          name="base_sysm_policy"
                          value={settingsDataState.base_sysm_policy}
                          onChange={handleChange}
                          className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          style={{ borderColor: "#d8dde0" }}
                          rows="6"
                          placeholder="Enter system policy..."
                          disabled={loading}
                        />
                      </div>

                      {/* Default Message */}
                      <div>
                        <h4 className="text-lg font-semibold mb-2" style={{ color: "#212b32" }}>
                          Default Message
                        </h4>
                        <textarea
                          name="default_message"
                          value={settingsDataState.default_message}
                          onChange={handleChange}
                          className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          style={{ borderColor: "#d8dde0" }}
                          rows="6"
                          placeholder="Enter default message..."
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "environment" && (
                    <div className="space-y-6">
                      <div>
                        {Object.entries(environmentSetting).map(([key, value]) => (
                          <div key={key} className="mb-4 relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {toReadableLabel(key)}
                            </label>
                            <input
                              type={visibleFields[key] ? "text" : "password"}
                              name={key}
                              value={value}
                              onChange={handleEnvironmentChange}
                              className="w-full p-3 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              style={{ borderColor: "#d8dde0" }}
                              placeholder={`Enter value for ${key}`}
                              disabled={loading}
                            />
                            {/* Toggle Visibility */}
                            <button
                              type="button"
                              onClick={() => toggleVisibility(key)}
                              className="absolute right-10 top-10 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              title="Toggle visibility"
                            >
                              {visibleFields[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            {/* Copy to Clipboard */}
                            <button
                              type="button"
                              onClick={() => handleCopy(key, value)}
                              className="absolute right-2 top-10 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              title="Copy to clipboard"
                            >
                              <Copy size={18} />
                            </button>
                            {/* Copied Feedback */}
                            {copiedField === key && (
                              <span className="text-xs text-green-600 absolute right-2 -bottom-5">Copied!</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer with Save Button */}
            {hasUnsavedChanges && !initialLoading && (
              <div className="hidden border-t p-4 bg-gray-50" style={{ borderTopColor: "#d8dde0" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Unsaved changes detected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-300 hover:bg-white bg-transparent"
                      disabled={loading}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Discard Changes
                    </Button>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="text-white shadow-md hover:shadow-lg transition-all px-6"
                      style={{ backgroundColor: "#10B981" }}
                      disabled={loading}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Setting