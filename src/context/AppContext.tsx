import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, GasCylinder, Invoice, Settings, InvoiceItem } from '@/types';
import { generateInvoiceNumber, calculateTotal, initInvoiceNumberSystem } from '@/lib/utils';
import { getLogosBase64 } from '@/lib/logos';

interface AppContextType {
  isAuthenticated: boolean;
  login: (code: string) => boolean;
  logout: () => void;
  clients: Client[];
  setClients: (clients: Client[]) => void;
  inventory: GasCylinder[];
  setInventory: (inventory: GasCylinder[]) => void;
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  selectedInvoices: string[];
  toggleInvoiceSelection: (id: string) => void;
  selectAllInvoices: () => void;
  deselectAllInvoices: () => void;
  createManualInvoice: (clientId: string, items: InvoiceItem[]) => Invoice | null;
  deleteAllData: () => void;
  setInvoiceStartNumber: (startingNumber: number) => void;
}

const defaultSettings: Settings = {
  secretCode: '123456',
  companyName: 'ORANGE ENERGY',
  minInvoiceAmount: 3000,
  maxInvoiceAmount: 20000,
  companies: {
    'ORANGE ENERGY': {
      name: 'ORANGE ENERGY',
      address: 'RESIDENCE AL MACHRIK II – RUE JAAFAR BNOU HABIB – BOURGOGNE – CASABLANCA',
      rc: '339601',
      patente: '35697091',
      if: '15302869',
      cnss: '4682995',
      ice: '000509809000039'
    },
    'TRADIGAZ': {
      name: 'TRADIGAZ',
      address: 'AL WIFAQ GROUPE 7 IMM 53 APT 1 AIN SEBAA CASABLANCA',
      rc: '490573',
      patente: '30352039',
      cnss: '2435913',
      ice: '002717207000003'
    },
    'ARGANA ENERGY': {
      name: 'ARGANA ENERGY',
      address: 'RESIDENCE AL MACHRIK II – RUE JAAFAR BNOU HABIB – BOURGOGNE – CASABLANCA',
      rc: '634559',
      patente: '35607765',
      if: '65992905',
      cnss: '5583539',
      ice: '003531503000031'
    }
  }
};

const defaultInventory: GasCylinder[] = [
  { type: '12KG', totalQuantity: 0, distributedQuantity: 0, remainingQuantity: 0, unitPrice: 0, taxRate: 0 },
  { type: '6KG', totalQuantity: 0, distributedQuantity: 0, remainingQuantity: 0, unitPrice: 0, taxRate: 0 },
  { type: '3KG', totalQuantity: 0, distributedQuantity: 0, remainingQuantity: 0, unitPrice: 0, taxRate: 0 }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

// Function to merge existing inventory with default inventory
const mergeInventory = (storedInventory: GasCylinder[]): GasCylinder[] => {
  const merged = [...defaultInventory];
  
  // Update with stored values where they exist
  storedInventory.forEach(storedItem => {
    const index = merged.findIndex(defaultItem => defaultItem.type === storedItem.type);
    if (index !== -1) {
      merged[index] = storedItem;
    }
  });
  
  return merged;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load stored data from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventory, setInventory] = useState<GasCylinder[]>(defaultInventory);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  // Load stored data on initial render
  useEffect(() => {
    const loadData = async () => {
      const storedClients = localStorage.getItem('clients');
      const storedInventory = localStorage.getItem('inventory');
      const storedInvoices = localStorage.getItem('invoices');
      const storedSettings = localStorage.getItem('settings');

      if (storedClients) setClients(JSON.parse(storedClients));
      if (storedInventory) {
        const parsedInventory = JSON.parse(storedInventory);
        // Merge stored inventory with default inventory to ensure all types are present
        setInventory(mergeInventory(parsedInventory));
      }
      if (storedInvoices) setInvoices(JSON.parse(storedInvoices));
      
      // Load logos as base64
      const logos = await getLogosBase64();
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        
        // Migrate old company names to new ones
        let migratedSettings = { ...parsedSettings };
        
        // If old company name exists, migrate to ORANGE ENERGY as default
        if (parsedSettings.companyName === 'SEBAI AMA' || parsedSettings.companyName === 'STE ZAGAZ') {
          migratedSettings.companyName = 'ORANGE ENERGY';
        }
        
        // Ensure companies object exists and add logos
        if (!migratedSettings.companies) {
          migratedSettings.companies = defaultSettings.companies;
        }
        
        // Add logos to each company
        migratedSettings.companies = {
          'ORANGE ENERGY': {
            ...migratedSettings.companies['ORANGE ENERGY'],
            logo: logos['ORANGE ENERGY']
          },
          'TRADIGAZ': {
            ...migratedSettings.companies['TRADIGAZ'],
            logo: logos['TRADIGAZ']
          },
          'ARGANA ENERGY': {
            ...migratedSettings.companies['ARGANA ENERGY'],
            logo: logos['ARGANA ENERGY']
          }
        };
        
        setSettings(migratedSettings);
      } else {
        // No stored settings, use defaults with logos
        const defaultWithLogos = {
          ...defaultSettings,
          companies: {
            'ORANGE ENERGY': {
              ...defaultSettings.companies['ORANGE ENERGY'],
              logo: logos['ORANGE ENERGY']
            },
            'TRADIGAZ': {
              ...defaultSettings.companies['TRADIGAZ'],
              logo: logos['TRADIGAZ']
            },
            'ARGANA ENERGY': {
              ...defaultSettings.companies['ARGANA ENERGY'],
              logo: logos['ARGANA ENERGY']
            }
          }
        };
        setSettings(defaultWithLogos);
      }
      
      // Initialize invoice numbering system based on existing invoices
      initInvoiceNumberSystem();
    };
    
    loadData();
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const login = (code: string): boolean => {
    if (code === settings.secretCode) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleInvoiceSelection = (id: string) => {
    setSelectedInvoices(prev => 
      prev.includes(id) 
        ? prev.filter(invoiceId => invoiceId !== id)
        : [...prev, id]
    );
  };

  const selectAllInvoices = () => {
    setSelectedInvoices(invoices.map(invoice => invoice.id));
  };

  const deselectAllInvoices = () => {
    setSelectedInvoices([]);
  };
  
  // Function to set a new starting invoice number
  const setInvoiceStartNumber = (startingNumber: number) => {
    if (startingNumber > 0) {
      initInvoiceNumberSystem(startingNumber);
    }
  };

  // New function to create manual invoice
  const createManualInvoice = (clientId: string, items: InvoiceItem[]): Invoice | null => {
    // Find the client
    const client = clients.find(c => c.id === clientId);
    if (!client) return null;
    
    // Check if items are valid and available in inventory
    const updatedInventory = [...inventory];
    let canCreateInvoice = true;
    
    for (const item of items) {
      const cylinderIndex = updatedInventory.findIndex(cyl => cyl.type === item.description);
      
      if (cylinderIndex === -1 || updatedInventory[cylinderIndex].remainingQuantity < item.quantity) {
        canCreateInvoice = false;
        break;
      }
    }
    
    if (!canCreateInvoice) return null;
    
    // Update inventory
    for (const item of items) {
      const cylinderIndex = updatedInventory.findIndex(cyl => cyl.type === item.description);
      updatedInventory[cylinderIndex].remainingQuantity -= item.quantity;
      updatedInventory[cylinderIndex].distributedQuantity += item.quantity;
    }
    
    // Create new invoice
    const { subtotal, taxAmount, total } = calculateTotal(items);
    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      number: generateInvoiceNumber(),
      date: new Date().toLocaleDateString('fr-FR'),
      client,
      items,
      subtotal,
      taxAmount,
      total,
      companyName: settings.companyName // Use the company name from settings
    };
    
    // Update state
    setInventory(updatedInventory);
    setInvoices(prev => [...prev, newInvoice]);
    
    return newInvoice;
  };

  // Function to delete all data
  const deleteAllData = () => {
    setClients([]);
    setInventory(defaultInventory);
    setInvoices([]);
    setSelectedInvoices([]);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        clients,
        setClients,
        inventory,
        setInventory,
        invoices,
        setInvoices,
        settings,
        updateSettings,
        selectedInvoices,
        toggleInvoiceSelection,
        selectAllInvoices,
        deselectAllInvoices,
        createManualInvoice,
        deleteAllData,
        setInvoiceStartNumber
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
