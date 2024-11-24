-- CreateTable
CREATE TABLE "Spread" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "markPrice" DECIMAL(20,8) NOT NULL,
    "oraclePrice" DECIMAL(20,8) NOT NULL,
    "spread" DECIMAL(20,8) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Spread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingRate" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "rate" DECIMAL(20,8) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundingRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Spread_symbol_exchange_idx" ON "Spread"("symbol", "exchange");

-- CreateIndex
CREATE INDEX "Spread_timestamp_idx" ON "Spread"("timestamp");

-- CreateIndex
CREATE INDEX "FundingRate_symbol_exchange_idx" ON "FundingRate"("symbol", "exchange");

-- CreateIndex
CREATE INDEX "FundingRate_timestamp_idx" ON "FundingRate"("timestamp");
