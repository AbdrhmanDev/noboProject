export type RestaurantSeatingTable = {
  restaurantTableId: string;
  code: string;
  name: string | null;
  sortOrder: number;
  isOccupied: boolean;
  openSalesOrderCount: number;
};

export type RestaurantSeatingFloor = {
  restaurantFloorId: string;
  name: string;
  sortOrder: number;
  tables: RestaurantSeatingTable[];
};

export type RestaurantAdminStatus = "Active" | "Suspended";

export type RestaurantStatusFilter = {
  status?: RestaurantAdminStatus | "";
};

export type CreateRestaurantFloorRequest = {
  name: string;
  sortOrder: number;
};

export type RestaurantTableAdmin = {
  restaurantTableId: string;
  restaurantFloorId: string;
  code: string;
  name: string | null;
  sortOrder: number;
  status: RestaurantAdminStatus;
  createdAtUtc: string;
};

export type RestaurantFloorListItem = {
  restaurantFloorId: string;
  branchId: string;
  name: string;
  sortOrder: number;
  status: RestaurantAdminStatus;
  createdAtUtc: string;
  tableCount: number;
};

export type RestaurantFloorDetails = Omit<RestaurantFloorListItem, "tableCount"> & {
  tables: RestaurantTableAdmin[];
};

export type CreateRestaurantFloorResponse = Omit<RestaurantFloorListItem, "tableCount">;

export type UpdateRestaurantFloorRequest = CreateRestaurantFloorRequest;

export type ChangeRestaurantFloorStatusRequest = {
  status: RestaurantAdminStatus;
};

export type CreateRestaurantTableRequest = {
  code: string;
  name: string | null;
  sortOrder: number;
};

export type CreateRestaurantTableResponse = RestaurantTableAdmin;

export type UpdateRestaurantTableRequest = CreateRestaurantTableRequest;

export type ChangeRestaurantTableStatusRequest = {
  status: RestaurantAdminStatus;
};
