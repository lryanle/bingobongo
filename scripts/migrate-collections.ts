/**
 * Migration script to consolidate duplicate MongoDB collections
 * 
 * This script migrates data from plural collections (users, sessions, accounts)
 * to capitalized singular collections (Users, Sessions, Accounts) to match Better Auth's defaults.
 * 
 * Run with: npx tsx scripts/migrate-collections.ts
 */

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;

if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

async function migrateCollections() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log("Starting collection migration...");
    
    // Migrate users -> Users (capitalized to match Better Auth defaults)
    const usersCollection = db.collection("users");
    const userCollection = db.collection("Users");
    const usersCount = await usersCollection.countDocuments();
    
    if (usersCount > 0) {
      console.log(`Migrating ${usersCount} documents from 'users' to 'Users'...`);
      const users = await usersCollection.find({}).toArray();
      
      for (const user of users) {
        // Check if user already exists in 'Users' collection
        const existing = await userCollection.findOne({ _id: user._id });
        if (!existing) {
          await userCollection.insertOne(user);
        } else {
          console.log(`User ${user._id} already exists in 'Users' collection, skipping...`);
        }
      }
      
      console.log("✓ Users migration complete");
    } else {
      console.log("No documents in 'users' collection to migrate");
    }
    
    // Migrate sessions -> Sessions (capitalized to match Better Auth defaults)
    const sessionsCollection = db.collection("sessions");
    const sessionCollection = db.collection("Sessions");
    const sessionsCount = await sessionsCollection.countDocuments();
    
    if (sessionsCount > 0) {
      console.log(`Migrating ${sessionsCount} documents from 'sessions' to 'Sessions'...`);
      const sessions = await sessionsCollection.find({}).toArray();
      
      for (const session of sessions) {
        // Check if session already exists in 'Sessions' collection
        const existing = await sessionCollection.findOne({ _id: session._id });
        if (!existing) {
          await sessionCollection.insertOne(session);
        } else {
          console.log(`Session ${session._id} already exists in 'Sessions' collection, skipping...`);
        }
      }
      
      console.log("✓ Sessions migration complete");
    } else {
      console.log("No documents in 'sessions' collection to migrate");
    }
    
    // Migrate accounts -> Accounts (capitalized to match Better Auth defaults)
    const accountsCollection = db.collection("accounts");
    const accountCollection = db.collection("Accounts");
    const accountsCount = await accountsCollection.countDocuments();
    
    if (accountsCount > 0) {
      console.log(`Migrating ${accountsCount} documents from 'accounts' to 'Accounts'...`);
      const accounts = await accountsCollection.find({}).toArray();
      
      for (const account of accounts) {
        // Check if account already exists in 'Accounts' collection
        const existing = await accountCollection.findOne({ _id: account._id });
        if (!existing) {
          await accountCollection.insertOne(account);
        } else {
          console.log(`Account ${account._id} already exists in 'Accounts' collection, skipping...`);
        }
      }
      
      console.log("✓ Accounts migration complete");
    } else {
      console.log("No documents in 'accounts' collection to migrate");
    }
    
    // Ask user if they want to drop the old collections
    console.log("\nMigration complete!");
    console.log("\nNext steps:");
    console.log("1. Verify that all data has been migrated correctly");
    console.log("2. The codebase already uses capitalized collection names (Users, Sessions, Accounts)");
    console.log("3. Drop the old plural collections (users, sessions, accounts) manually if desired");
    console.log("\nTo drop the old collections, run:");
    console.log("  db.users.drop()");
    console.log("  db.sessions.drop()");
    console.log("  db.accounts.drop()");
    
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

migrateCollections()
  .then(() => {
    console.log("\n✓ Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Migration script failed:", error);
    process.exit(1);
  });

