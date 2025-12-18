import { PrismaClient, Prisma } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

const projectData: Prisma.ProjectCreateInput[] = [
    {
        name: "Ad Infinitum",
        projectId: 0,
        description: "A revolutionary AI Agent platform for developers",
        imageUrl: "https://i.imgur.com/9GcO44P.jpeg",
    },
    {
        name: "Hardware Card Wallets",
        projectId: 1,
        description:
            "Hardware Wallet that happens to be an NFC Card! All funders who fund 10+ tokens get a free card!",
        imageUrl: "https://i.imgur.com/CPhz19Ng.jpg",
    },
    {
        name: "Aetheria",
        projectId: 2,
        description: "An open-world blockchain educational game.",
        imageUrl: "https://i.imgur.com/uImH6Zf.jpeg",
    },
];

export async function main() {
    for (const project of projectData) {
        await prisma.project.create({
            data: project,
        });
    }
}

main();
