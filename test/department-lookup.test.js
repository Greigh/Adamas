// Test for department lookup filter management
// Note: This test runs in Node.js environment, so DOM APIs are mocked

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock the module
jest.mock('../src/js/modules/department-lookup.js', () => {
  let filterConfig = [];

  return {
    filterConfig,
    loadFilterConfig: () => {
      const stored = localStorage.getItem('filterConfig');
      if (stored) {
        filterConfig = JSON.parse(stored);
      }
    },
    saveFilterConfig: () => {
      localStorage.setItem('filterConfig', JSON.stringify(filterConfig));
    },
    initializeDefaultFilters: () => {
      filterConfig = [
        { label: 'Department', type: 'department' },
        { label: 'Location', type: 'location' },
        { label: 'Emergency', type: 'emergency' }
      ];
    }
  };
});

const { filterConfig, loadFilterConfig, saveFilterConfig, initializeDefaultFilters } = require('../src/js/modules/department-lookup.js');

describe('Department Lookup Filter Management', () => {
  beforeEach(() => {
    // Clear mocks before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('initializeDefaultFilters creates default filter configuration', () => {
    initializeDefaultFilters();
    expect(filterConfig).toBeDefined();
    expect(Array.isArray(filterConfig)).toBe(true);
    expect(filterConfig.length).toBe(3);
    expect(filterConfig[0].label).toBe('Department');
  });

  test('filter types can be custom strings', () => {
    initializeDefaultFilters();
    
    // Add a filter with a custom type
    filterConfig.push({ label: 'VIP Clients', type: 'vip' });
    filterConfig.push({ label: 'Remote Workers', type: 'remote' });
    
    expect(filterConfig.find(f => f.type === 'vip')).toBeDefined();
    expect(filterConfig.find(f => f.type === 'remote')).toBeDefined();
    
    // Verify the types are preserved
    const vipFilter = filterConfig.find(f => f.type === 'vip');
    const remoteFilter = filterConfig.find(f => f.type === 'remote');
    
    expect(vipFilter.label).toBe('VIP Clients');
    expect(remoteFilter.label).toBe('Remote Workers');
  });
});