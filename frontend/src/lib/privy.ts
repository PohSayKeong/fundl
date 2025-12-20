import { PrivyClient, User } from "@privy-io/node";

export const privy = new PrivyClient({
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    appSecret: process.env.PRIVY_APP_SECRET!,
});

export const getUserFromPrivy = async (idToken: string) => {
    const user = await privy.users().get({ id_token: idToken });
    return user;
};

export const doesUserOwnAddress = (user: User, address: string) => {
    return (
        user.linked_accounts.find(
            (account) =>
                account.type === "wallet" &&
                "address" in account &&
                account.address.toLowerCase() === address.toLowerCase()
        ) !== undefined
    );
};
