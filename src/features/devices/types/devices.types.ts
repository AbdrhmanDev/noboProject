// ---- Contract note ----
// Device Registry, Edge Agents, and Discovery/Matching are already fully
// implemented on the backend. PrintJobs (GET list/details) and the device
// hardware-binding lookup (GET /devices/{id}/hardware-binding) are being
// added by a separate backend agent to match exactly the shapes below —
// modeled from the verified contract in the feature spec, not guessed.

// ---- Enums (case-insensitive on the wire; always send PascalCase) ----

export type DeviceType =
  | "ReceiptPrinter"
  | "KitchenPrinter"
  | "BarcodeScanner"
  | "CashDrawer"
  | "CustomerDisplay"
  | "KdsDevice"
  | "PaymentTerminal"
  | "Scale";

export type DeviceStatus = "Active" | "Inactive";

export type DeviceHealthStatus = "Unknown" | "Online" | "Offline" | "Degraded" | "Error";

export type DeviceCertificationStatus =
  | "Unknown"
  | "Certified"
  | "Compatible"
  | "AdapterRequired"
  | "Unsupported";

export type DeviceConnectionType = "Usb" | "NetworkEthernet" | "Wifi" | "Bluetooth" | "SerialCom";

export type EdgeAgentStatus = "PendingEnrollment" | "Active" | "Revoked" | "Inactive";

export type EdgeAgentHealthStatus = "Unknown" | "Online" | "Offline" | "Degraded" | "Error";

export type MatchConfidence = "Exact" | "Strong" | "Possible" | "Ambiguous" | "None";

export type PrintJobStatus = "Queued" | "Claimed" | "Printing" | "Succeeded" | "Failed";

export type PrintJobDocumentType = "TestPrint";

export type DeviceHardwareBindingTransportType =
  | "Usb"
  | "NetworkEthernet"
  | "Wifi"
  | "Bluetooth"
  | "SerialCom";

// ---- Devices ----

export type DeviceResponse = {
  deviceId: string;
  companyId: string;
  branchId: string;
  code: string;
  name: string;
  deviceType: DeviceType;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  firmwareVersion: string | null;
  connectionType: DeviceConnectionType;
  connectionConfigurationJson: string | null;
  posTerminalId: string | null;
  kitchenStationId: string | null;
  edgeAgentId: string | null;
  status: DeviceStatus;
  healthStatus: DeviceHealthStatus;
  lastSeenAtUtc: string | null;
  lastHealthMessage: string | null;
  certificationStatus: DeviceCertificationStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type DevicesListFilters = {
  deviceType?: DeviceType | "";
  status?: DeviceStatus | "";
  health?: DeviceHealthStatus | "";
  certification?: DeviceCertificationStatus | "";
  posTerminalId?: string;
  kitchenStationId?: string;
};

export type CreateDeviceRequest = {
  code: string;
  name: string;
  deviceType: DeviceType;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  firmwareVersion?: string | null;
  connectionType: DeviceConnectionType;
  connectionConfigurationJson?: string | null;
  posTerminalId?: string | null;
  kitchenStationId?: string | null;
  edgeAgentId?: string | null;
  certification?: DeviceCertificationStatus;
};

export type UpdateDeviceRequest = CreateDeviceRequest;

export type UpdateDeviceStatusRequest = {
  status: DeviceStatus;
};

export type TestPrintResponse = {
  printJobId: string;
  status: PrintJobStatus;
  createdAtUtc: string;
};

export type DeviceHardwareBindingResponse = {
  id: string;
  transportType: DeviceHardwareBindingTransportType;
  usbVendorId: string | null;
  usbProductId: string | null;
  usbSerialNumber: string | null;
  usbInstanceId: string | null;
  networkAddress: string | null;
  networkPort: number | null;
  comPort: string | null;
  bluetoothIdentifier: string | null;
  // Set only when transportType represents an installed Windows printer queue -- execution
  // goes through this spooler queue, not a raw USB VID/PID/instance path.
  windowsPrinterQueueName: string | null;
  confirmedAtUtc: string;
};

// ---- Edge Agents ----

export type EdgeAgentResponse = {
  edgeAgentId: string;
  companyId: string;
  branchId: string;
  code: string;
  name: string;
  machineName: string | null;
  platform: string | null;
  operatingSystem: string | null;
  agentVersion: string | null;
  status: EdgeAgentStatus;
  healthStatus: EdgeAgentHealthStatus;
  enrolledAtUtc: string | null;
  lastHeartbeatAtUtc: string | null;
  lastIpAddress: string | null;
  lastReportedAgentVersion: string | null;
  lastHealthMessage: string | null;
  lastConfigurationRevision: number | null;
  lastConfigurationAcknowledgedAtUtc: string | null;
  lastConfigurationAcknowledgmentStatus: string | null;
  lastConfigurationAcknowledgmentMessage: string | null;
  lastCapabilitiesJson: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type EdgeAgentsListFilters = {
  status?: EdgeAgentStatus | "";
  health?: EdgeAgentHealthStatus | "";
};

export type CreateEdgeAgentRequest = {
  code: string;
  name: string;
};

export type UpdateEdgeAgentStatusRequest = {
  status: EdgeAgentStatus;
};

export type EdgeAgentEnrollmentResponse = {
  edgeAgentId: string;
  enrollmentCredential: string;
  expiresAtUtc: string;
};

// ---- Discovery / Matching ----

export type DiscoveredDeviceMatchProposalResponse = {
  proposedDeviceId: string | null;
  proposedDeviceCode: string | null;
  proposedDeviceName: string | null;
  confidence: MatchConfidence;
  reasons: string[];
};

export type DiscoveredDeviceCandidateResponse = {
  discoveryId: string;
  transportType: DeviceHardwareBindingTransportType;
  displayName: string | null;
  manufacturer: string | null;
  model: string | null;
  usbVendorId: string | null;
  usbProductId: string | null;
  serialNumber: string | null;
  comPort: string | null;
  networkAddress: string | null;
  networkPort: number | null;
  bluetoothIdentifier: string | null;
  windowsPrinterQueueName: string | null;
  windowsPrinterDriverName: string | null;
  windowsPrinterPortName: string | null;
  deviceCategoryGuess: DeviceType | null;
  identificationConfidence: MatchConfidence;
  detected: boolean;
  identified: boolean;
  transportReachable: boolean;
  adapterAvailable: boolean;
  certificationStatus: DeviceCertificationStatus;
  connectionTestResult: string | null;
  notes: string | null;
  matchedDeviceId: string | null;
  proposal: DiscoveredDeviceMatchProposalResponse | null;
};

export type DiscoveredDeviceReportResponse = {
  discoveryReportId: string;
  companyId: string;
  branchId: string;
  edgeAgentId: string;
  discoverySessionId: string;
  reportedAtUtc: string;
  candidateCount: number;
  candidates: DiscoveredDeviceCandidateResponse[];
  createdAtUtc: string;
};

export type DiscoveredDevicesFilters = {
  take?: number;
};

export type ConfirmDiscoveredDeviceCreateRequest = {
  code: string;
  name: string;
  deviceType: DeviceType;
  posTerminalId?: string | null;
  kitchenStationId?: string | null;
  certification?: DeviceCertificationStatus;
};

export type ConfirmDiscoveredDeviceRequest = {
  existingDeviceId?: string;
  createDevice?: ConfirmDiscoveredDeviceCreateRequest;
};

export type ConfirmDiscoveredDeviceResponse = {
  deviceId: string;
  deviceHardwareBindingId: string;
  edgeAgentId: string;
  discoveryId: string;
  action: "CreatedFromCandidate" | "Linked";
  transportType: DeviceHardwareBindingTransportType;
  confirmedAtUtc: string;
};

// ---- Print Jobs ----

export type PrintJobResponse = {
  printJobId: string;
  companyId: string;
  branchId: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  edgeAgentId: string | null;
  edgeAgentCode: string | null;
  edgeAgentName: string | null;
  documentType: PrintJobDocumentType;
  status: PrintJobStatus;
  documentTitle: string | null;
  createdAtUtc: string;
  claimedAtUtc: string | null;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  attemptCount: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

export type PrintJobsListFilters = {
  deviceId?: string;
  status?: PrintJobStatus | "";
  documentType?: PrintJobDocumentType | "";
};
