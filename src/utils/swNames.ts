export const SW_NAMES: Record<string, string> = {
  sw1: 'Images Handling',
  sw2: 'External User Mapping',
  sw3: 'Vehicle Get Directly from DB',
  sw4: 'Vehicle Lot Get From API',
  sw5: 'Vehicle update directly To DB',
  sw6: 'vehicle lot update with api',
  sw7: 'Order Get with api',
  sw8: 'Company Get with api',
  sw9: 'Company Get with api',
  sw10: 'Company Get with api',
  sw11: 'Map User company Id with code',
  sw12: 'Vehicle update directly to db',
  sw13: 'Servicetoken get and Vehicle Lot Get with api',
  sw14: 'vehicle lot update with api',
  sw15: 'Parent VehicleLot + Order Get with api',
  sw16: 'price calculations',
  sw17: 'Price history set with code',
  sw18: 'vehicle create directly with db',
  sw19: 'Lot Creation/Get with API',
  sw20: 'Vehicle lot get with api',
  sw21: 'Price calculations',
  sw22: 'Get order reference into vehicle lot',
  sw23: 'Vehicle lot update with api (if Concept -> status change)',
  sw24: 'vehicle lot status change with api',
  sw25: 'vehicle lot status change with api',
  sw26: 'vehicle lot add to catalog with api',
  sw27: 'vehicle lot status change with api',
  sw28: 'vehicle lot status change with api',
  sw29: 'vehicle lot add to catalog with api',
  sw30: 'vehicle lot add to catalog with api',
};

export const SW_DESCRIPTIONS: Record<string, string> = {
  sw1: 'Time to store vehicle images via StorageAPI and process technical damages (sets default images if missing)',
  sw2: 'Time to map external user credentials to internal user system via AuthClient.MapExternalUser',
  sw3: 'Time to retrieve parent/original vehicle from database using vehicleService.GetFirst',
  sw4: 'Time to fetch parent vehicle lot from Auction API using AuctionAPIClient.VehicleLotGet',
  sw5: 'Time to update parent vehicle record directly in MongoDB database',
  sw6: 'Time to update parent vehicle lot via Auction API (used for duplicate stock vehicles)',
  sw7: 'Time to retrieve order details from Order API using OrderAPIClient.Get',
  sw8: 'Time to fetch seller/creditor company information from Auth API (includes address and invoice info)',
  sw9: 'Time to fetch auctioneer company information from Auth API (includes address and invoice info)',
  sw10: 'Time to fetch owner company information from Auth API (includes delivery settings and address)',
  sw11: 'Time to set vehicle metadata OwnerID and OwnerName from seller company information',
  sw12: 'Time to update vehicle record directly in MongoDB database (used when ModelAction is Update)',
  sw13: 'Combined time to get service token and fetch vehicle lot from Auction API (for lot updates)',
  sw14: 'Time to update vehicle lot via Auction API (includes vehicle status, price settings, and item info)',
  sw15: 'Combined time to get service token, fetch parent lot by vehicle ID, and retrieve associated order from APIs',
  sw16: 'Time to calculate vehicle purchase prices using PriceCalculationClient.CalculateAsync',
  sw17: 'Time to set ModifiedBy field in the latest price history entry',
  sw18: 'Time to create new vehicle record directly in MongoDB database via vehicleService.Create',
  sw19: 'Time to create or get vehicle lot via Auction API including catalog assignment (VehicleLot_Create)',
  sw20: 'Time to fetch vehicle lot from Auction API (used for stock vehicle order creation)',
  sw21: 'Time to calculate order prices using PriceCalculationClient.CalculateAsync (for stock vehicle orders)',
  sw22: 'Time to set SalesOrderReference on vehicle lot from calculated order',
  sw23: 'Time to update vehicle lot via Auction API and change status to Sold (if not a concept vehicle)',
  sw24: 'Time to change vehicle lot status to Draft/InPreparation via Auction API (for duplicate stock vehicles)',
  sw25: 'Time to change vehicle lot status to Draft/AvailableForSale via Auction API (for duplicate stock vehicles)',
  sw26: 'Time to add vehicle lot to catalog via Auction API Catalog_AddLots (for duplicate stock vehicles)',
  sw27: 'Time to change vehicle lot status to Draft/InPreparation via Auction API (for regular external vehicles)',
  sw28: 'Time to change vehicle lot status to Draft/AvailableForSale via Auction API (for regular external vehicles)',
  sw29: 'Time to add vehicle lot to catalog via Auction API Catalog_AddLots (for regular external vehicles)',
  sw30: 'Time to add vehicle lot to Autotelex catalog via Auction API Catalog_AddLots',
};

export function getSWName(sw: string): string {
  return SW_NAMES[sw.toLowerCase()] || sw.toUpperCase();
}

export function getSWDescription(sw: string): string {
  return SW_DESCRIPTIONS[sw.toLowerCase()] || '';
}

export function getSWDisplayName(sw: string): string {
  const name = getSWName(sw);
  return `${sw.toUpperCase()}: ${name}`;
}

