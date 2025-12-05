// MongoDB Index Creation Script
// Copy and paste this into MongoDB shell or Compass

// ============================================
// CRITICAL INDEXES (Create these first)
// ============================================

// 1. Base filter index - supports initial $match stage
// This is the MOST IMPORTANT index as it filters all documents before facets
db.collection.createIndex(
  { 
    "Metadata.IsActive": 1, 
    "ItemInfo.SourceType": 1 
  },
  { 
    name: "idx_base_filter",
    background: true 
  }
);

// 2. Status + CatalogBuyerGroups + Date Range
// Supports: Published, OpenForBidding, Stock, Draft, Cancelled
db.collection.createIndex(
  { 
    "Metadata.IsActive": 1, 
    "ItemInfo.SourceType": 1, 
    "Status": 1, 
    "CatalogBuyerGroups": 1,
    "CatalogClosedForBidding": 1
  },
  { 
    name: "idx_status_catalog_date",
    background: true 
  }
);

// 3. BidsOnLot array fields - supports complex $elemMatch queries
// Supports: InConsideration, NotSold, PendingBidExtensionApprovals, 
//           MyBidsOnSale, IncomingCounterBid
db.collection.createIndex(
  { 
    "Metadata.IsActive": 1, 
    "ItemInfo.SourceType": 1, 
    "Status": 1, 
    "BidsOnLot.BuyerCompanyID": 1,
    "BidsOnLot.BidStatus": 1,
    "BidsOnLot.Type": 1,
    "BidsOnLot.CounterBidCompanyId": 1,
    "BidsOnLot.BidExtensionStatus": 1
  },
  { 
    name: "idx_bids_on_lot",
    background: true 
  }
);

// 4. Buyer/Seller company IDs
// Supports: Sold, StockAwaited
db.collection.createIndex(
  { 
    "Metadata.IsActive": 1, 
    "ItemInfo.SourceType": 1, 
    "Status": 1, 
    "Buyer.InternalCompanyID": 1,
    "Seller.InternalCompanyID": 1
  },
  { 
    name: "idx_buyer_seller",
    background: true 
  }
);

// 5. Favorite users
// Supports: Favorite facet
db.collection.createIndex(
  { 
    "Metadata.IsActive": 1, 
    "ItemInfo.SourceType": 1, 
    "FavoritedUsers": 1, 
    "Status": 1
  },
  { 
    name: "idx_favorite",
    background: true 
  }
);

// 6. ItemInfo potential stock conditions
// Supports: Sold, StockAwaited (complex $or conditions)
db.collection.createIndex(
  { 
    "Metadata.IsActive": 1, 
    "ItemInfo.SourceType": 1, 
    "Status": 1, 
    "ItemInfo.PotentiallyInStock": 1,
    "PotentialOrderReference.OrderID": 1
  },
  { 
    name: "idx_iteminfo_potential",
    background: true 
  }
);

// ============================================
// VERIFICATION QUERIES
// ============================================

// Check all indexes
db.collection.getIndexes();

// Check index sizes
db.collection.stats().indexSizes;

// Test query performance (replace 'collection' with your actual collection name)
// db.collection.explain("executionStats").aggregate([
//   { $match: { "Metadata.IsActive": true, "ItemInfo.SourceType": 4 } },
//   // ... rest of your pipeline
// ]);

// ============================================
// OPTIONAL: Partial Indexes (if applicable)
// ============================================

// If Metadata.IsActive: true and ItemInfo.SourceType: 4 represent a small subset,
// consider partial indexes to reduce index size:

// db.collection.createIndex(
//   { "Status": 1, "CatalogBuyerGroups": 1 },
//   { 
//     partialFilterExpression: { 
//       "Metadata.IsActive": true, 
//       "ItemInfo.SourceType": 4 
//     },
//     name: "idx_partial_status_catalog",
//     background: true
//   }
// );

// ============================================
// NOTES
// ============================================
// 1. Replace 'collection' with your actual collection name
// 2. The 'background: true' option creates indexes without blocking operations
// 3. Monitor index creation progress: db.currentOp()
// 4. After creating indexes, analyze query plans with .explain()
// 5. Consider dropping unused indexes to improve write performance


