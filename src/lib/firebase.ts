// ============================================
// FIREBASE CONFIGURATION
// ============================================
// 
// To set up Firebase:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use existing)
// 3. Click "Add app" and select Web (</>)
// 4. Copy the firebaseConfig values below
// 5. Go to Firestore Database and create a database
// 6. Set rules to allow read/write (for development):
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /{document=**} {
//          allow read, write: if true;
//        }
//      }
//    }
//
// ============================================

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, setDoc } from 'firebase/firestore'

// Firebase configuration - Law Firm Management
const firebaseConfig = {
  apiKey: "AIzaSyBohoQw5gniCnTW_9mzQPJ25oiEJCryiZg",
  authDomain: "lawfirm-management-1cd2a.firebaseapp.com",
  projectId: "lawfirm-management-1cd2a",
  storageBucket: "lawfirm-management-1cd2a.firebasestorage.app",
  messagingSenderId: "753464690092",
  appId: "1:753464690092:web:f23d7f2533bf20dcc56609"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Collection names
export const COLLECTIONS = {
  users: 'users',
  clients: 'clients',
  cases: 'cases',
  tasks: 'tasks',
  courtLogs: 'courtLogs',
  messages: 'messages',
  timeEntries: 'timeEntries',
  invoices: 'invoices',
  passwords: 'passwords',
  settings: 'settings',
}

// Export Firestore functions for use in storage
export {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  setDoc,
}
