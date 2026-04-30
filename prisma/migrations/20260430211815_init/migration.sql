-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "username" TEXT,
    "displayUsername" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "caregiver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "preferredLanguage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentWorkflowId" TEXT,
    "currentStepId" TEXT,
    "firstContactDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastInteraction" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "caregiver_keyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caregiverId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "caregiver_keyword_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregiver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "caregiver_note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caregiverId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT 'Admin User',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "caregiver_note_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregiver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" DATETIME,
    "selectedStepId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "workflow_step" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "keyword" TEXT,
    "contentEn" TEXT NOT NULL DEFAULT '',
    "contentEs" TEXT NOT NULL DEFAULT '',
    "nextStepId" TEXT,
    "positionX" INTEGER NOT NULL DEFAULT 0,
    "positionY" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_step_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_option" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL DEFAULT '',
    "labelEs" TEXT NOT NULL DEFAULT '',
    "replyValue" TEXT NOT NULL,
    "targetStepId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_option_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_step" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caregiverId" TEXT,
    "phone" TEXT NOT NULL,
    "contactName" TEXT NOT NULL DEFAULT 'Unknown Sender',
    "messageText" TEXT NOT NULL,
    "normalizedText" TEXT,
    "direction" TEXT NOT NULL,
    "keywordDetected" TEXT,
    "language" TEXT,
    "workflowId" TEXT,
    "workflowStepId" TEXT,
    "providerName" TEXT,
    "providerMessageId" TEXT,
    "sentAt" DATETIME,
    "receivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "message_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregiver" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "smsProvider" TEXT NOT NULL DEFAULT 'twilio',
    "twilioAccountSid" TEXT NOT NULL DEFAULT '',
    "twilioAuthToken" TEXT NOT NULL DEFAULT '',
    "twilioPhoneNumber" TEXT NOT NULL DEFAULT '',
    "twilioMessagingServiceSid" TEXT NOT NULL DEFAULT '',
    "defaultResponseMessage" TEXT NOT NULL DEFAULT 'Thank you for contacting the Shaken Baby Alliance COPE Support System. We''re here to help.',
    "systemActive" BOOLEAN NOT NULL DEFAULT true,
    "chatbotEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiProvider" TEXT NOT NULL DEFAULT 'gemini',
    "aiApiKey" TEXT NOT NULL DEFAULT '',
    "aiModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "autoArchiveMessages" BOOLEAN NOT NULL DEFAULT true,
    "autoArchiveDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "message_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT,
    "caregiverId" TEXT,
    "phone" TEXT NOT NULL,
    "contactName" TEXT NOT NULL DEFAULT 'Unknown Sender',
    "eventType" TEXT NOT NULL DEFAULT 'MESSAGE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "direction" TEXT,
    "providerName" TEXT,
    "providerMessageId" TEXT,
    "providerResponse" TEXT,
    "errorMessage" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "message_log_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "message_log_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregiver" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_knowledge_entry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ai_knowledge_chunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "chunkHash" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "embeddingJson" TEXT,
    "embeddingModel" TEXT,
    "embeddingProvider" TEXT,
    "embeddingDimension" INTEGER,
    "embeddedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_knowledge_chunk_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ai_knowledge_entry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_response_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT,
    "caregiverId" TEXT,
    "phone" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "aiResponse" TEXT,
    "matchedEntryIds" TEXT,
    "matchedChunkIds" TEXT,
    "retrievalMode" TEXT,
    "embeddingModel" TEXT,
    "emergencyFlag" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_response_log_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_response_log_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregiver" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_name_key" ON "user"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "caregiver_phone_key" ON "caregiver"("phone");

-- CreateIndex
CREATE INDEX "caregiver_status_idx" ON "caregiver"("status");

-- CreateIndex
CREATE INDEX "caregiver_keyword_keyword_idx" ON "caregiver_keyword"("keyword");

-- CreateIndex
CREATE UNIQUE INDEX "caregiver_keyword_caregiverId_keyword_key" ON "caregiver_keyword"("caregiverId", "keyword");

-- CreateIndex
CREATE INDEX "caregiver_note_caregiverId_createdAt_idx" ON "caregiver_note"("caregiverId", "createdAt");

-- CreateIndex
CREATE INDEX "workflow_status_idx" ON "workflow"("status");

-- CreateIndex
CREATE INDEX "workflow_step_workflowId_sortOrder_idx" ON "workflow_step"("workflowId", "sortOrder");

-- CreateIndex
CREATE INDEX "workflow_step_workflowId_type_idx" ON "workflow_step"("workflowId", "type");

-- CreateIndex
CREATE INDEX "workflow_option_stepId_sortOrder_idx" ON "workflow_option"("stepId", "sortOrder");

-- CreateIndex
CREATE INDEX "message_caregiverId_createdAt_idx" ON "message"("caregiverId", "createdAt");

-- CreateIndex
CREATE INDEX "message_phone_createdAt_idx" ON "message"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "message_workflowId_idx" ON "message"("workflowId");

-- CreateIndex
CREATE INDEX "message_workflowStepId_idx" ON "message"("workflowStepId");

-- CreateIndex
CREATE INDEX "message_log_messageId_createdAt_idx" ON "message_log"("messageId", "createdAt");

-- CreateIndex
CREATE INDEX "message_log_caregiverId_createdAt_idx" ON "message_log"("caregiverId", "createdAt");

-- CreateIndex
CREATE INDEX "message_log_phone_createdAt_idx" ON "message_log"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "ai_knowledge_entry_active_idx" ON "ai_knowledge_entry"("active");

-- CreateIndex
CREATE INDEX "ai_knowledge_entry_category_idx" ON "ai_knowledge_entry"("category");

-- CreateIndex
CREATE INDEX "ai_knowledge_chunk_entryId_idx" ON "ai_knowledge_chunk"("entryId");

-- CreateIndex
CREATE INDEX "ai_knowledge_chunk_embeddingModel_idx" ON "ai_knowledge_chunk"("embeddingModel");

-- CreateIndex
CREATE UNIQUE INDEX "ai_knowledge_chunk_entryId_chunkHash_key" ON "ai_knowledge_chunk"("entryId", "chunkHash");

-- CreateIndex
CREATE INDEX "ai_response_log_messageId_idx" ON "ai_response_log"("messageId");

-- CreateIndex
CREATE INDEX "ai_response_log_caregiverId_idx" ON "ai_response_log"("caregiverId");

-- CreateIndex
CREATE INDEX "ai_response_log_phone_idx" ON "ai_response_log"("phone");
