"use client";

import * as React from "react";
import { usePrivy } from "@privy-io/react-auth";

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import { cn } from "@/lib/utils";

const components: { title: string; href: string; description: string }[] = [
    {
        title: "Create Project",
        href: "/create-project",
        description:
            "Create a project and start receiving funds from your supporters.",
    },
    {
        title: "Boost Project",
        href: "/boost-project",
        description:
            "Boost your project to increase visibility and attract more supporters.",
    },
];

export default function Navbar() {
    const { ready, authenticated, login, logout, user } = usePrivy();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="bg-bg w-screen">
            <NavigationMenu className="z-[5] m750:max-w-[300px] mx-auto">
                <NavigationMenuList className="m750:max-w-[300px]">
                    <NavigationMenuItem>
                        <NavigationMenuLink
                            className={navigationMenuTriggerStyle()}
                            href="/"
                        >
                            <span className="m750:max-w-[80px] m750:text-xs">
                                fundl.us
                            </span>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink
                            className={navigationMenuTriggerStyle()}
                            href="/projects"
                        >
                            <span className="m750:max-w-[80px] m750:text-xs">
                                View Projects
                            </span>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="m750:max-w-[80px] m750:text-xs">
                            Creators
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] lg:w-[600px] ">
                                {components.map((component) => (
                                    <ListItem
                                        key={component.title}
                                        title={component.title}
                                        href={component.href}
                                    >
                                        {component.description}
                                    </ListItem>
                                ))}
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        {!mounted || !ready ? (
                            <div
                                className={cn(
                                    navigationMenuTriggerStyle(),
                                    "cursor-default opacity-60"
                                )}
                            >
                                <span className="m750:max-w-[80px] m750:text-xs">
                                    Loading
                                </span>
                            </div>
                        ) : !authenticated ? (
                            <button
                                onClick={login}
                                className={cn(
                                    navigationMenuTriggerStyle(),
                                    "cursor-pointer"
                                )}
                            >
                                <span className="m750:max-w-[80px] m750:text-xs">
                                    Login
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={logout}
                                className={cn(
                                    navigationMenuTriggerStyle(),
                                    "cursor-pointer"
                                )}
                            >
                                <span className="m750:max-w-[80px] m750:text-xs">
                                    {user?.wallet?.address
                                        ? `${user.wallet.address.slice(
                                              0,
                                              6
                                          )}...${user.wallet.address.slice(-4)}`
                                        : "Logout"}
                                </span>
                            </button>
                        )}
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    );
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "hover:bg-accent block text-mtext select-none space-y-1 rounded-base border-2 border-transparent p-3 leading-none no-underline outline-none transition-colors hover:border-border dark:hover:border-darkBorder",
                        className
                    )}
                    {...props}
                >
                    <div className="text-base font-heading leading-none">
                        {title}
                    </div>
                    <p className="text-muted-foreground font-base line-clamp-2 text-sm leading-snug">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    );
});
ListItem.displayName = "ListItem";
