/**
 * Migration script to consolidate duplicate MongoDB collections
 * 
 * This script migrates data from plural collections (users, sessions, accounts)
 * to singular collections (user, session, account) to match Better Auth's defaults.
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
    
    // Migrate users -> user
    const usersCollection = db.collection("users");
    const userCollection = db.collection("user");
    const usersCount = await usersCollection.countDocuments();
    
    if (usersCount > 0) {
      console.log(`Migrating ${usersCount} documents from 'users' to 'user'...`);
      const users = await usersCollection.find({}).toArray();
      
      for (const user of users) {
        // Check if user already exists in 'user' collection
        const existing = await userCollection.findOne({ _id: user._id });
        if (!existing) {
          await userCollection.insertOne(user);
        } else {
          console.log(`User ${user._id} already exists in 'user' collection, skipping...`);
        }
      }
      
      console.log("✓ Users migration complete");
    } else {
      console.log("No documents in 'users' collection to migrate");
    }
    
    // Migrate sessions -> session
    const sessionsCollection = db.collection("sessions");
    const sessionCollection = db.collection("session");
    const sessionsCount = await sessionsCollection.countDocuments();
    
    if (sessionsCount > 0) {
      console.log(`Migrating ${sessionsCount} documents from 'sessions' to 'session'...`);
      const sessions = await sessionsCollection.find({}).toArray();
      
      for (const session of sessions) {
        // Check if session already exists in 'session' collection
        const existing = await sessionCollection.findOne({ _id: session._id });
        if (!existing) {
          await sessionCollection.insertOne(session);
        } else {
          console.log(`Session ${session._id} already exists in 'session' collection, skipping...`);
        }
      }
      
      console.log("✓ Sessions migration complete");
    } else {
      console.log("No documents in 'sessions' collection to migrate");
    }
    
    // Migrate accounts -> account
    const accountsCollection = db.collection("accounts");
    const accountCollection = db.collection("account");
    const accountsCount = await accountsCollection.countDocuments();
    
    if (accountsCount > 0) {
      console.log(`Migrating ${accountsCount} documents from 'accounts' to 'account'...`);
      const accounts = await accountsCollection.find({}).toArray();
      
      for (const account of accounts) {
        // Check if account already exists in 'account' collection
        const existing = await accountCollection.findOne({ _id: account._id });
        if (!existing) {
          await accountCollection.insertOne(account);
        } else {
          console.log(`Account ${account._id} already exists in 'account' collection, skipping...`);
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
    console.log("2. Update your codebase to use singular collection names (user, session, account)");
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

