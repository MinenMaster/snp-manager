"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const apiUrl = "https://localhost:3033/api";
    const [activeTab, setActiveTab] = useState("register");
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("authToken");
            if (token) {
                try {
                    const response = await fetch(`${apiUrl}/auth`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    });

                    if (response.status === 200) {
                        router.push("/");
                    } else {
                        localStorage.removeItem("authToken");
                    }
                } catch (err) {
                    console.error("Token-Überprüfung fehlgeschlagen:", err);
                    localStorage.removeItem("authToken");
                }
            }
        };
        checkAuth();
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const endpoint =
            activeTab === "login" ? `${apiUrl}/login` : `${apiUrl}/register`;

        const data =
            activeTab === "register"
                ? {
                      username: formData.username,
                      email: formData.email,
                      password: formData.password,
                  }
                : {
                      identifier: formData.username || formData.email,
                      password: formData.password,
                  };

        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();

                if (activeTab === "register") {
                    setActiveTab("login");
                } else if (activeTab === "login") {
                    if (result.token) {
                        localStorage.setItem("authToken", result.token);
                    }
                    router.push("/");
                }
            } else {
                const error = await response.json();
                setErrorMessage(error.message || "Ein Fehler ist aufgetreten");
            }
        } catch (err) {
            console.error("Fehler beim Abschicken des Formulars:", err);
            setErrorMessage(
                "Ein Fehler ist aufgetreten. Bitte versuche es später erneut."
            );
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-blue-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                {/* Tab Switcher */}
                <div className="flex justify-between mb-4">
                    <button
                        onClick={() => setActiveTab("login")}
                        className={`text-lg font-semibold py-2 px-4 rounded-tl-lg ${
                            activeTab === "login"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200"
                        }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setActiveTab("register")}
                        className={`text-lg font-semibold py-2 px-4 rounded-tr-lg ${
                            activeTab === "register"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200"
                        }`}
                    >
                        Signup
                    </button>
                </div>

                {/* Error and Success Messages */}
                {errorMessage && (
                    <div className="mb-4 text-red-500">
                        <p>{errorMessage}</p>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-4 text-green-500">
                        <p>{successMessage}</p>
                    </div>
                )}

                {/* Login Form */}
                {activeTab === "login" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Username or Email"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        <button
                            type="submit"
                            className="w-full p-2 bg-blue-500 text-white rounded"
                        >
                            Login
                        </button>
                    </form>
                )}

                {/* Register Form */}
                {activeTab === "register" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Username"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email Address"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        <button
                            type="submit"
                            className="w-full p-2 bg-blue-500 text-white rounded"
                        >
                            Signup
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
