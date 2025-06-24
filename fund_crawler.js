/**
 * Multi-Fund Crawler - Pure JavaScript Implementation
 * Support multiple funds crawling and comparison from MoneyDJ website
 * 
 * @author Gavin
 * @version 2.0.0
 */

class MultiFundCrawler {
    constructor() {
        // CORS proxy services for bypassing CORS restrictions
        this.corsProxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?'
        ];
        this.currentProxyIndex = 0;
        
        // Fund configurations
        this.fundConfigs = {
            'SHZ19-2453': {
                code: 'SHZ19-2453',
                name: 'BlackRock Global Fund - World Mining Fund A2 USD',
                shortName: '全球礦業基金',
                category: '礦業',
                emoji: '⛏️',
                color: '#e74c3c'
            },
            'SHZ18-2449': {
                code: 'SHZ18-2449', 
                name: 'BlackRock Global Fund - World Gold Fund A2 USD',
                shortName: '全球黃金基金',
                category: '黃金',
                emoji: '🥇',
                color: '#f39c12'
            }
        };
        
        // Base URL template for MoneyDJ
        this.baseUrl = 'https://tcbbankfund.moneydj.com/w/wb/wb02.djhtm?a=';
    }

    /**
     * Get fund configuration by code
     * 
     * @param {string} fundCode - Fund code
     * @returns {Object|null} Fund configuration object
     */
    getFundConfig(fundCode) {
        return this.fundConfigs[fundCode] || null;
    }

    /**
     * Get all available fund codes
     * 
     * @returns {Array<string>} Array of fund codes
     */
    getAvailableFunds() {
        return Object.keys(this.fundConfigs);
    }

    /**
     * Get fund URL by code
     * 
     * @param {string} fundCode - Fund code
     * @returns {string} Complete fund URL
     */
    getFundUrl(fundCode) {
        return this.baseUrl + fundCode;
    }

    /**
     * Fetch URL with CORS proxy
     * 
     * @param {string} url - Target URL to fetch
     * @returns {Promise<string>} HTML content
     */
    async fetchWithCorsProxy(url) {
        for (let i = 0; i < this.corsProxies.length; i++) {
            try {
                const proxy = this.corsProxies[(this.currentProxyIndex + i) % this.corsProxies.length];
                const proxyUrl = proxy + encodeURIComponent(url);
                
                console.log(`Trying proxy: ${proxy}`);
                
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3'
                    },
                    timeout: 15000
                });

                if (response.ok) {
                    this.currentProxyIndex = (this.currentProxyIndex + i) % this.corsProxies.length;
                    return await response.text();
                }
            } catch (error) {
                console.warn(`Proxy ${this.corsProxies[(this.currentProxyIndex + i) % this.corsProxies.length]} failed:`, error);
            }
        }
        
        throw new Error('All CORS proxies failed. Please check network connection.');
    }

    /**
     * Parse NAV data from HTML table
     * 
     * @param {string} html - HTML content from MoneyDJ
     * @returns {Array<Object>} Array of NAV data objects
     */
    parseNavData(html) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const navData = [];
            
            // Find all table rows with NAV data
            const tables = doc.querySelectorAll('table');
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                
                for (const row of rows) {
                    const cells = row.querySelectorAll('td');
                    
                    // Table should have 4 columns: Date, NAV, Change, Change%
                    if (cells.length >= 4) {
                        try {
                            const dateText = cells[0].textContent.trim();
                            const navText = cells[1].textContent.trim();
                            const changeText = cells[2].textContent.trim();
                            const changePercentText = cells[3].textContent.trim();
                            
                            // Validate date format (should be MM/DD)
                            if (dateText.match(/^\d{2}\/\d{2}$/)) {
                                const nav = parseFloat(navText);
                                const change = parseFloat(changeText);
                                const changePercent = parseFloat(changePercentText);
                                
                                if (!isNaN(nav) && !isNaN(change) && !isNaN(changePercent)) {
                                    // Add year to date (assume current year)
                                    const currentYear = new Date().getFullYear();
                                    const fullDate = `${currentYear}/${dateText}`;
                                    
                                    navData.push({
                                        date: dateText,
                                        fullDate: fullDate,
                                        nav: nav,
                                        change: change,
                                        changePercent: changePercent,
                                        rawDateText: dateText,
                                        rawNavText: navText,
                                        rawChangeText: changeText,
                                        rawChangePercentText: changePercentText
                                    });
                                }
                            }
                        } catch (error) {
                            // Skip invalid rows
                            continue;
                        }
                    }
                }
            }
            
            return navData;
        } catch (error) {
            console.error('Error parsing NAV data:', error);
            return [];
        }
    }

    /**
     * Get latest NAV data
     * 
     * @param {Array<Object>} navData - Array of NAV data
     * @returns {Object|null} Latest NAV data object
     */
    getLatestNav(navData) {
        if (navData.length === 0) return null;
        
        // Sort by date (most recent first)
        const sortedData = [...navData].sort((a, b) => {
            const dateA = new Date(a.fullDate);
            const dateB = new Date(b.fullDate);
            return dateB - dateA;
        });
        
        return sortedData[0];
    }

    /**
     * Get highest NAV data
     * 
     * @param {Array<Object>} navData - Array of NAV data
     * @returns {Object|null} Highest NAV data object
     */
    getHighestNav(navData) {
        if (navData.length === 0) return null;
        
        // Find the entry with highest NAV
        return navData.reduce((highest, current) => {
            return (current.nav > highest.nav) ? current : highest;
        });
    }

    /**
     * Get lowest NAV data
     * 
     * @param {Array<Object>} navData - Array of NAV data
     * @returns {Object|null} Lowest NAV data object
     */
    getLowestNav(navData) {
        if (navData.length === 0) return null;
        
        // Find the entry with lowest NAV
        return navData.reduce((lowest, current) => {
            return (current.nav < lowest.nav) ? current : lowest;
        });
    }

    /**
     * Get mock data for specific fund
     * 
     * @param {string} fundCode - Fund code
     * @returns {Object} Mock data object
     */
    getMockData(fundCode) {
        const mockDataMap = {
            'SHZ19-2453': {
                latest: {
                    date: '06/20',
                    fullDate: '2024/06/20',
                    nav: 64.32,
                    change: 0.26,
                    changePercent: 0.41
                },
                highest: {
                    date: '06/05',
                    fullDate: '2024/06/05',
                    nav: 65.57,
                    change: 1.04,
                    changePercent: 1.61
                },
                lowest: {
                    date: '05/16',
                    fullDate: '2024/05/16',
                    nav: 60.21,
                    change: -0.07,
                    changePercent: -0.12
                }
            },
            'SHZ18-2449': {
                latest: {
                    date: '06/20',
                    fullDate: '2024/06/20',
                    nav: 60.51,
                    change: 0.59,
                    changePercent: 0.98
                },
                highest: {
                    date: '06/13',
                    fullDate: '2024/06/13',
                    nav: 61.94,
                    change: 1.16,
                    changePercent: 1.91
                },
                lowest: {
                    date: '05/16',
                    fullDate: '2024/05/16',
                    nav: 51.95,
                    change: 0.31,
                    changePercent: 0.60
                }
            }
        };
        
        return mockDataMap[fundCode] || mockDataMap['SHZ19-2453'];
    }

    /**
     * Fetch and parse single fund NAV data
     * 
     * @param {string} fundCode - Fund code
     * @returns {Promise<Object>} Result object with success status and data
     */
    async getSingleFundData(fundCode) {
        const fundConfig = this.getFundConfig(fundCode);
        if (!fundConfig) {
            throw new Error(`Unknown fund code: ${fundCode}`);
        }

        try {
            console.log(`Starting data crawl for fund: ${fundCode}`);
            
            const url = this.getFundUrl(fundCode);
            const html = await this.fetchWithCorsProxy(url);
            const navData = this.parseNavData(html);
            
            if (navData.length === 0) {
                console.warn(`No NAV data found for ${fundCode}, returning mock data`);
                const mockData = this.getMockData(fundCode);
                return {
                    success: true,
                    fundCode: fundCode,
                    fundConfig: fundConfig,
                    data: {
                        latest: mockData.latest,
                        highest: mockData.highest,
                        lowest: mockData.lowest,
                        allData: []
                    },
                    timestamp: Date.now(),
                    source: 'mock'
                };
            }
            
            const latest = this.getLatestNav(navData);
            const highest = this.getHighestNav(navData);
            const lowest = this.getLowestNav(navData);
            
            return {
                success: true,
                fundCode: fundCode,
                fundConfig: fundConfig,
                data: {
                    latest: latest,
                    highest: highest,
                    lowest: lowest,
                    allData: navData
                },
                timestamp: Date.now(),
                source: 'moneydj'
            };
            
        } catch (error) {
            console.error(`Error fetching fund data for ${fundCode}:`, error);
            
            const mockData = this.getMockData(fundCode);
            return {
                success: false,
                error: error.message,
                fundCode: fundCode,
                fundConfig: fundConfig,
                data: {
                    latest: mockData.latest,
                    highest: mockData.highest,
                    lowest: mockData.lowest,
                    allData: []
                },
                timestamp: Date.now(),
                source: 'mock'
            };
        }
    }

    /**
     * Fetch and parse multiple funds NAV data
     * 
     * @param {Array<string>} fundCodes - Array of fund codes
     * @returns {Promise<Object>} Result object with all funds data
     */
    async getMultipleFundsData(fundCodes) {
        try {
            console.log(`Starting multi-fund data crawl for: ${fundCodes.join(', ')}`);
            
            // Fetch all funds data in parallel
            const promises = fundCodes.map(fundCode => this.getSingleFundData(fundCode));
            const results = await Promise.all(promises);
            
            // Organize results
            const fundsData = {};
            let successCount = 0;
            let totalRecords = 0;
            
            results.forEach(result => {
                fundsData[result.fundCode] = result;
                if (result.success) successCount++;
                totalRecords += result.data.allData.length;
            });
            
            return {
                success: true,
                funds: fundsData,
                summary: {
                    totalFunds: fundCodes.length,
                    successCount: successCount,
                    totalRecords: totalRecords,
                    fundCodes: fundCodes
                },
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('Error in multi-fund data crawl:', error);
            
            return {
                success: false,
                error: error.message,
                funds: {},
                summary: {
                    totalFunds: fundCodes.length,
                    successCount: 0,
                    totalRecords: 0,
                    fundCodes: fundCodes
                },
                timestamp: Date.now()
            };
        }
    }

    /**
     * Compare multiple funds performance
     * 
     * @param {Object} fundsData - Funds data object
     * @returns {Object} Comparison results
     */
    compareFunds(fundsData) {
        const comparison = {
            bestPerformer: null,
            worstPerformer: null,
            highestNav: null,
            lowestNav: null,
            comparison: []
        };
        
        const funds = Object.values(fundsData);
        
        if (funds.length === 0) return comparison;
        
        // Initialize comparison
        let bestChange = -Infinity;
        let worstChange = Infinity;
        let highestNav = -Infinity;
        let lowestNav = Infinity;
        
        // Analyze each fund
        funds.forEach(fund => {
            if (fund.data.latest) {
                const latest = fund.data.latest;
                
                // Track best/worst performers
                if (latest.changePercent > bestChange) {
                    bestChange = latest.changePercent;
                    comparison.bestPerformer = fund;
                }
                
                if (latest.changePercent < worstChange) {
                    worstChange = latest.changePercent;
                    comparison.worstPerformer = fund;
                }
                
                // Track highest/lowest NAV
                if (latest.nav > highestNav) {
                    highestNav = latest.nav;
                    comparison.highestNav = fund;
                }
                
                if (latest.nav < lowestNav) {
                    lowestNav = latest.nav;
                    comparison.lowestNav = fund;
                }
                
                // Add to comparison list
                comparison.comparison.push({
                    fundCode: fund.fundCode,
                    fundConfig: fund.fundConfig,
                    latestNav: latest.nav,
                    change: latest.change,
                    changePercent: latest.changePercent,
                    date: latest.date
                });
            }
        });
        
        // Sort comparison by performance
        comparison.comparison.sort((a, b) => b.changePercent - a.changePercent);
        
        return comparison;
    }
}

// Create global instance
const multiFundCrawler = new MultiFundCrawler(); 