"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ColorScheme = "light" | "dark";
type SidebarSize = "default" | "condensed" | "hidden";

interface ThemeContextType {
    colorScheme: ColorScheme;
    primaryColor: string;
    menuColor: ColorScheme;
    sidebarSize: SidebarSize;
    setColorScheme: (scheme: ColorScheme) => void;
    setPrimaryColor: (color: string) => void;
    setMenuColor: (color: ColorScheme) => void;
    setSidebarSize: (size: SidebarSize) => void;
    resetTheme: () => void;
}

const DEFAULT_THEME = {
    colorScheme: "light" as ColorScheme,
    primaryColor: "#00C896", // Default brand green
    menuColor: "dark" as ColorScheme,
    sidebarSize: "default" as SidebarSize,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [colorScheme, setColorScheme] = useState<ColorScheme>(DEFAULT_THEME.colorScheme);
    const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_THEME.primaryColor);
    const [menuColor, setMenuColor] = useState<ColorScheme>(DEFAULT_THEME.menuColor);
    const [sidebarSize, setSidebarSize] = useState<SidebarSize>(DEFAULT_THEME.sidebarSize);
    const [isMounted, setIsMounted] = useState(false);

    // Initial load from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme-settings");
        if (savedTheme) {
            try {
                const parsed = JSON.parse(savedTheme);
                if (parsed.colorScheme) setColorScheme(parsed.colorScheme);
                if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
                if (parsed.menuColor) setMenuColor(parsed.menuColor);
                if (parsed.sidebarSize) setSidebarSize(parsed.sidebarSize);
            } catch (e) {
                console.error("Failed to parse saved theme", e);
            }
        }
        setIsMounted(true);
    }, []);

    // Save to localStorage and apply side effects
    useEffect(() => {
        if (!isMounted) return;

        localStorage.setItem("theme-settings", JSON.stringify({
            colorScheme,
            primaryColor,
            menuColor,
            sidebarSize
        }));

        // Apply dark mode class
        const root = window.document.documentElement;
        if (colorScheme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        // Apply primary color variable
        root.style.setProperty("--primary", primaryColor);
        root.style.setProperty("--ring", primaryColor);
        root.style.setProperty("--chart-1", primaryColor);
        root.style.setProperty("--sidebar-primary", primaryColor);
        root.style.setProperty("--sidebar-ring", primaryColor);

    }, [colorScheme, primaryColor, menuColor, sidebarSize, isMounted]);

    const resetTheme = () => {
        setColorScheme(DEFAULT_THEME.colorScheme);
        setPrimaryColor(DEFAULT_THEME.primaryColor);
        setMenuColor(DEFAULT_THEME.menuColor);
        setSidebarSize(DEFAULT_THEME.sidebarSize);
    };

    if (!isMounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{
            colorScheme,
            primaryColor,
            menuColor,
            sidebarSize,
            setColorScheme,
            setPrimaryColor,
            setMenuColor,
            setSidebarSize,
            resetTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
