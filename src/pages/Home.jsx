"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button.jsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Badge } from "@/components/ui/badge.jsx"
import { MessageCircle, BadgeIcon as IdCard, Shield, Heart, Activity } from "lucide-react"
import "../App.css"
import Settings from "../components/settings/Settings.jsx"
import NHSPolicyChat from "../components/chat/NHSPolicyChat.jsx"

function Home() {
    // Use ref to track if data has been fetched
    const dataFetched = useRef(false)
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const fetchSettings = useCallback(async () => {
        // Prevent multiple simultaneous calls
        if (dataFetched.current) {
            return;
        }
        try {
            dataFetched.current = true
            const response = await fetch(`${API_BASE_URL}/getDefaultMessage`)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const default_message = (await response.json()).data || {}

            localStorage.setItem("defaultMessage", JSON.stringify(default_message))

        } catch (error) {
        } finally {
        }
    }, [API_BASE_URL]) // Only depend on API_BASE_URL

    useEffect(() => {
        if (!dataFetched.current) {
            fetchSettings()
        }
    }, [fetchSettings])

    const [isChatOpen, setIsChatOpen] = useState(false)
    const [isWebsiteScrap, setIsWebsiteScrap] = useState(false)
    // Microsoft 365 Agents SDK integration
    useEffect(() => {
        const script = document.createElement("script")
        script.src = "https://cdn.botframework.com/botframework-webchat/latest/webchat.js"
        script.async = true
        script.onload = () => {
            console.log("WebChat script loaded")
        }
        document.body.appendChild(script)

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script)
            }
        }
    }, [])

    const openChat = () => {
        setIsChatOpen(true)
    }

    const closeChat = () => {
        setIsChatOpen(false)
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100"
            style={{ backgroundColor: "#f0f4f5" }}
        >
            {/* Header */}
            <header
                className="bg-white border-b-4 border-blue-600 sticky top-0 z-40"
                style={{ borderBottomColor: "#005eb8" }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Desktop layout */}
                    <div className="hidden md:flex justify-between items-center py-4">
                        {/* Left side: Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center logo">
                                <svg
                                    className="nhsuk-logo"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 40 16"
                                    height="40"
                                    width="100"
                                >
                                    <path fill="#005eb8" d="M0 0h40v16H0z"></path>
                                    <path
                                        fill="#fff"
                                        d="M3.9 1.5h4.4l2.6 9h.1l1.8-9h3.3l-2.8 13H9l-2.7-9h-.1l-1.8 9H1.1M17.3 1.5h3.6l-1 4.9h4L25 1.5h3.5l-2.7 13h-3.5l1.1-5.6h-4.1l-1.2 5.6h-3.4M37.7 4.4c-.7-.3-1.6-.6-2.9-.6-1.4 0-2.5.2-2.5 1.3 0 1.8 5.1 1.2 5.1 5.1 0 3.6-3.3 4.5-6.4 4.5-1.3 0-2.9-.3-4-.7l.8-2.7c.7.4 2.1.7 3.2.7s2.8-.2 2.8-1.5c0-2.1-5.1-1.3-5.1-5 0-3.4 2.9-4.4 5.8-4.4 1.6 0 3.1.2 4 .6"
                                    ></path>
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold" style={{ color: "#212b32" }}>
                                    NHS AI Assistant
                                </h1>
                                <p className="text-sm" style={{ color: "#4c6272" }}>
                                    Powered by YIIC Innovations
                                </p>
                            </div>
                        </div>

                        {/* Right side: Badge + Settings */}
                        <div className="flex items-center space-x-3">
                            <Badge
                                className="flex items-center px-3 py-1 rounded-full text-sm font-medium"
                                style={{ backgroundColor: "#007f3b", color: "white" }}
                            >
                                <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                                Available 24/7
                            </Badge>
                            <Settings className="bg-[#005eb8] p-2 rounded-lg text-white w-4 h-4" />
                        </div>
                    </div>

                    {/* Mobile layout */}
                    <div className="flex flex-col md:hidden items-center py-3">
                        {/* Row 1: Logo + Settings */}
                        <div className="flex justify-between w-full items-center">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center logo">
                                    <svg
                                        className="nhsuk-logo"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 40 16"
                                        height="40"
                                        width="100"
                                    >
                                        <path fill="#005eb8" d="M0 0h40v16H0z"></path>
                                        <path
                                            fill="#fff"
                                            d="M3.9 1.5h4.4l2.6 9h.1l1.8-9h3.3l-2.8 13H9l-2.7-9h-.1l-1.8 9H1.1M17.3 1.5h3.6l-1 4.9h4L25 1.5h3.5l-2.7 13h-3.5l1.1-5.6h-4.1l-1.2 5.6h-3.4M37.7 4.4c-.7-.3-1.6-.6-2.9-.6-1.4 0-2.5.2-2.5 1.3 0 1.8 5.1 1.2 5.1 5.1 0 3.6-3.3 4.5-6.4 4.5-1.3 0-2.9-.3-4-.7l.8-2.7c.7.4 2.1.7 3.2.7s2.8-.2 2.8-1.5c0-2.1-5.1-1.3-5.1-5 0-3.4 2.9-4.4 5.8-4.4 1.6 0 3.1.2 4 .6"
                                        ></path>
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold" style={{ color: "#212b32" }}>
                                        NHS AI Assistant
                                    </h1>
                                    <p className="text-xs" style={{ color: "#4c6272" }}>
                                        Powered by YIIC Innovations
                                    </p>
                                </div>
                            </div>
                            <Settings className="bg-[#005eb8] p-2 rounded-lg text-white w-4 h-4" />
                        </div>

                        {/* Row 2: Badge centered */}
                        <div className="mt-2">
                            <Badge
                                className="flex items-center px-3 rounded-full text-sm font-medium"
                                style={{ backgroundColor: "#007f3b", color: "white" }}
                            >
                                <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                                Available 24/7
                            </Badge>
                        </div>
                    </div>
                </div>
            </header>


            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="mb-8">
                        <Badge className="mb-4 text-white" style={{ backgroundColor: "#005eb8" }}>
                            <Heart className="w-4 h-4 mr-1" />
                            NHS Digital Assistant
                        </Badge>
                        <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: "#212b32" }}>
                            Your Trusted NHS
                            <span className="block" style={{ color: "#005eb8" }}>
                                AI Companion
                            </span>
                        </h2>
                        <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: "#4c6272" }}>
                            Get instant, reliable support with our AI-powered assistant. Available 24/7, it helps you quickly search, navigate, and understand policies, news, and guidance across a wide range of topics in the NHS.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        {/* <Button
              onClick={openChat}
              size="lg"
              className="text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              style={{ backgroundColor: "#005eb8", borderColor: "#005eb8" }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Your Policy Search
            </Button> */}

                        <Button
                            onClick={() => {
                                openChat();
                                setIsWebsiteScrap(false);
                            }}
                            size="lg"
                            className="text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            style={{ backgroundColor: "#005eb8", borderColor: "#005eb8" }}
                        >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Start Your Policy Search
                        </Button>
                        {isChatOpen && (
                            <NHSPolicyChat openChat={isChatOpen} websiteScrap={isWebsiteScrap} onClose={closeChat} />
                        )}
                        <Button
                            onClick={() => {
                                openChat();
                                setIsWebsiteScrap(true);
                            }}
                            variant="outline"
                            size="lg"
                            className="px-8 py-3 text-lg font-semibold border-2 transition-all duration-300 bg-transparent hover:scale-105"
                            style={{ borderColor: "#005eb8", color: "#005eb8" }}
                        >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Learn about Digital Staff Passport
                        </Button>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-3 gap-6 mt-16">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
                            <CardHeader className="text-center pb-4">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: "#f0f4f5" }}
                                >
                                    <IdCard className="w-6 h-6" style={{ color: "#d5281b" }} />
                                </div>
                                <CardTitle className="text-xl" style={{ color: "#212b32" }} >
                                    One Stop Shop
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-center" style={{ color: "#4c6272" }}>
                                    NHS AI assistant can help you with all your NHS employement related queries, where queries fall outside its scope, it directs you to the most relevant information or the appropriate team.
                                </CardDescription>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
                            <CardHeader className="text-center pb-4">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: "#f0f4f5" }}
                                >
                                    <Activity className="w-6 h-6" style={{ color: "#005eb8" }} />
                                </div>
                                <CardTitle className="text-xl" style={{ color: "#212b32" }}>
                                    NHS-Approved Policies
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-center" style={{ color: "#4c6272" }}>
                                    All Responses are based exclusively on established NHS policies, and will not provide responses outside the scope of its knowledge.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
                            <CardHeader className="text-center pb-4">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: "#f0f4f5" }}
                                >
                                    <Shield className="w-6 h-6" style={{ color: "#007f3b" }} />
                                </div>
                                <CardTitle className="text-xl" style={{ color: "#212b32" }}>
                                    Secure & Confidential
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-center" style={{ color: "#4c6272" }}>
                                    The NHS AI assistant does not store personal information, is not trained on user data, search history, and will not provide responses outside the scope of its knowledge.
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </div>

                    {/* NHS Trust Statement */}
                    <div
                        className="mt-16 p-6 rounded-lg border-l-4"
                        style={{ backgroundColor: "#fff9c4", borderLeftColor: "#ffeb3b" }}
                    >
                        <div className="flex items-center justify-center space-x-3 mb-3">
                            <Heart className="w-5 h-5" style={{ color: "#d5281b" }} />
                            <span className="font-semibold" style={{ color: "#212b32" }}>
                                Trusted by millions across the UK
                            </span>
                        </div>
                        <p className="text-sm" style={{ color: "#4c6272" }}>
                            This AI assistant is designed to complement, not replace, professional medical advice. For urgent medical
                            concerns, please call 999 or visit your nearest A&E department.
                        </p>
                    </div>
                </div>
            </section>

            {/* Chat Interface Overlay */}
            {/* {isChatOpen && (
        <Chat />
        
      )} */}

            {/* Footer */}
            <footer className="text-white py-12" style={{ backgroundColor: "#212b32" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-3 mb-4">
                            <div
                                className="logo w-8 h-8 rounded-lg flex items-center justify-center"
                            >
                                {/* <span className="text-white font-bold text-sm">NHS</span> */}
                                <svg className="nhsuk-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 16" height="40" width="100">
                                    <path className="nhsuk-logo__background" fill="#005eb8" d="M0 0h40v16H0z"></path>
                                    <path className="nhsuk-logo__text" fill="#fff" d="M3.9 1.5h4.4l2.6 9h.1l1.8-9h3.3l-2.8 13H9l-2.7-9h-.1l-1.8 9H1.1M17.3 1.5h3.6l-1 4.9h4L25 1.5h3.5l-2.7 13h-3.5l1.1-5.6h-4.1l-1.2 5.6h-3.4M37.7 4.4c-.7-.3-1.6-.6-2.9-.6-1.4 0-2.5.2-2.5 1.3 0 1.8 5.1 1.2 5.1 5.1 0 3.6-3.3 4.5-6.4 4.5-1.3 0-2.9-.3-4-.7l.8-2.7c.7.4 2.1.7 3.2.7s2.8-.2 2.8-1.5c0-2.1-5.1-1.3-5.1-5 0-3.4 2.9-4.4 5.8-4.4 1.6 0 3.1.2 4 .6"></path>
                                </svg>
                            </div>
                            <span className="text-xl font-bold">NHS AI Assistant Demo</span>
                        </div>
                        <p className="mb-4" style={{ color: "#768692" }}>
                            Powered by YIIC Innovations and NHS Digital Innovation
                        </p>
                        {/* <p className="text-sm" style={{ color: "#4c6272" }}>
                            Built with React, Tailwind CSS, and NHS Design System principles
                        </p> */}
                        <div className="mt-6 pt-6 border-t" style={{ borderTopColor: "#4c6272" }}>
                            <p className="text-xs" style={{ color: "#768692" }}>
                                © NHS England. This is a demonstration application. For real NHS services, visit nhs.uk
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home;
