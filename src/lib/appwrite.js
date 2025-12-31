import { Client, Databases } from 'appwrite';

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const databases = new Databases(client);

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const WORKSHOP_COLLECTION_ID = import.meta.env.VITE_APPWRITE_WORKSHOP_COLLECTION_ID;
export const PARTICIPANT_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PARTICIPANT_COLLECTION_ID;