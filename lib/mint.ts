import IORedis from "ioredis";
import { createWalletClient, http, getContract } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import "dotenv/config"; // Load env vars
import prisma from "@/lib/db";
import { ABI } from "@/lib/abi";

// Setup Viem Client
const pKey = process.env.PRIVATE_KEY?.startsWith("0x") 
  ? process.env.PRIVATE_KEY 
  : `0x${process.env.PRIVATE_KEY}`;

const account = privateKeyToAccount(pKey as `0x${string}`);

const client = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.RPC_URL),
});

const contract = getContract({
  address: process.env.CONTRACT_ADDRESS as `0x${string}`,
  abi: ABI,
  client,
});

export async function mintNFT(teamId: string, walletAddress: string, tokenUri: string) {
    console.log(`Processing direct mint for team ${teamId} to ${walletAddress} with URI ${tokenUri}`);

    try {
      // Call batchMint with single item array
      const hash = await contract.write.batchMint([
        [walletAddress],
        [tokenUri],
      ]);

      console.log(`Transaction sent: ${hash}`);

      // Update DB
      await prisma.team.update({
        where: { teamId },
        data: {
          nftMinted: true,
        },
      });

      console.log(`Team ${teamId} updated`);
      return hash;
      
    } catch (error) {
      console.error(`Mint failed for ${teamId}:`, error);
      throw error;
    }
}
