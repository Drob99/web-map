// Airport Navigation Data Structures
// Complete location database with coordinates, connections, and navigation data

const AIRPORT_DATA = {
    // Terminal layout dimensions (for coordinate system)
    layout: {
        width: 800,
        height: 600,
        terminals: ['A', 'B', 'C'],
        levels: ['L1', 'L2', 'L3', 'L4']
    },

    // Current user location (starting point)
    currentLocation: {
        id: 'current_position',
        name: 'Your Location',
        coordinates: { x: 100, y: 300 },
        terminal: 'B',
        level: 'L2'
    },

    // Comprehensive location database
    locations: {
        // Food & Drinks - Starbucks
        'starbucks_b_l4': {
            id: 'starbucks_b_l4',
            name: 'Starbucks',
            address: 'L4, Terminal B',
            coordinates: { x: 250, y: 150 },
            terminal: 'B',
            level: 'L4',
            category: 'Food & Drinks',
            subcategory: 'Drinks',
            type: 'starbucks',
            amenities: ['WiFi', 'Seating', 'Mobile Order', 'Grab & Go'],
            hours: '5:00 AM - 11:00 PM',
            phone: '(555) 123-4567',
            description: 'Premium coffee and light snacks'
        },
        'starbucks_c_l3': {
            id: 'starbucks_c_l3',
            name: 'Starbucks',
            address: 'L3, Terminal C',
            coordinates: { x: 450, y: 200 },
            terminal: 'C',
            level: 'L3',
            category: 'Food & Drinks',
            subcategory: 'Drinks',
            type: 'starbucks',
            amenities: ['WiFi', 'Seating', 'Mobile Order'],
            hours: '5:30 AM - 10:30 PM',
            phone: '(555) 123-4568',
            description: 'Premium coffee and light snacks'
        },
        'starbucks_a_l2': {
            id: 'starbucks_a_l2',
            name: 'Starbucks',
            address: 'L2, Terminal A',
            coordinates: { x: 150, y: 400 },
            terminal: 'A',
            level: 'L2',
            category: 'Food & Drinks',
            subcategory: 'Drinks',
            type: 'starbucks',
            amenities: ['WiFi', 'Seating', 'Drive-thru'],
            hours: '5:00 AM - 10:00 PM',
            phone: '(555) 123-4569',
            description: 'Premium coffee and light snacks'
        },

        // Food & Drinks - Fast Food
        'panda_b_l4': {
            id: 'panda_b_l4',
            name: 'Panda Express',
            address: 'L4, Terminal B',
            coordinates: { x: 300, y: 150 },
            terminal: 'B',
            level: 'L4',
            category: 'Food & Drinks',
            subcategory: 'Fast Food',
            type: 'panda',
            amenities: ['Quick Service', 'Asian Cuisine', 'Takeout'],
            hours: '6:00 AM - 10:00 PM',
            phone: '(555) 234-5678',
            description: 'Fresh Asian cuisine'
        },
        'burger_king_b_l2': {
            id: 'burger_king_b_l2',
            name: 'Burger King',
            address: 'L2, Terminal B',
            coordinates: { x: 200, y: 300 },
            terminal: 'B',
            level: 'L2',
            category: 'Food & Drinks',
            subcategory: 'Fast Food',
            type: 'burger',
            amenities: ['Quick Service', 'Burgers', 'Fries'],
            hours: '5:00 AM - 11:00 PM',
            phone: '(555) 345-6789',
            description: 'Flame-grilled burgers'
        },

        // Shops - Duty Free
        'duty_free_a_l3': {
            id: 'duty_free_a_l3',
            name: 'Duty Free',
            address: 'Terminal 1',
            coordinates: { x: 180, y: 350 },
            terminal: 'A',
            level: 'L3',
            category: 'Shops',
            subcategory: 'Duty Free',
            type: 'duty_free',
            amenities: ['Shops', 'retails'],
            hours: '5:00 AM - 12:00 AM',
            phone: '(555) 456-7890',
            description: 'Tax-free shopping for travelers'
        },

        // Services - Lounges
        'centurion_lounge_b_l4': {
            id: 'centurion_lounge_b_l4',
            name: 'American Express Centurion Lounge',
            address: 'L4, Terminal B',
            coordinates: { x: 350, y: 150 },
            terminal: 'B',
            level: 'L4',
            category: 'Services',
            subcategory: 'Lounges',
            type: 'amex',
            amenities: ['Premium Lounge', 'Complimentary Food', 'WiFi', 'Showers'],
            hours: '5:00 AM - 11:00 PM',
            phone: '(555) 567-8901',
            description: 'Premium airport lounge experience'
        }
    },

    // Navigation paths between locations
    paths: {
        'current_position_to_starbucks_b_l4': {
            from: 'current_position',
            to: 'starbucks_b_l4',
            distance: 0.3,
            duration: 4,
            difficulty: 'Easy',
            steps: [
                { text: 'Start at your current location', distance: '57 feet', icon: '🚶', coordinates: { x: 100, y: 300 } },
                { text: 'Head toward Security Checkpoint B', distance: '72 feet', icon: '➡️', coordinates: { x: 150, y: 280 } },
                { text: 'Take escalator to Level 3', distance: '108 feet', icon: '⬆️', coordinates: { x: 180, y: 250 } },
                { text: 'Continue straight past Gate B12', distance: '156 feet', icon: '➡️', coordinates: { x: 200, y: 200 } },
                { text: 'Turn left at the main corridor', distance: '89 feet', icon: '↰', coordinates: { x: 220, y: 180 } },
                { text: 'Walk past the duty-free shop', distance: '134 feet', icon: '➡️', coordinates: { x: 240, y: 160 } },
                { text: 'Arrive at Starbucks on your right', distance: '0 feet', icon: '🎯', coordinates: { x: 250, y: 150 } }
            ]
        }
    },

    // Helper methods
    getLocationsByCategory: function(category) {
        return Object.values(this.locations).filter(location => location.category === category);
    },

    getLocationsBySubcategory: function(category, subcategory) {
        return Object.values(this.locations).filter(location => 
            location.category === category && location.subcategory === subcategory
        );
    },

    getLocationById: function(id) {
        return this.locations[id];
    },

    getPathBetween: function(fromId, toId) {
        const pathKey = `${fromId}_to_${toId}`;
        return this.paths[pathKey] || this.generatePath(fromId, toId);
    },

    generatePath: function(fromId, toId) {
        // Simple path generation for demo purposes
        const fromLocation = this.getLocationById(fromId) || this.currentLocation;
        const toLocation = this.getLocationById(toId);
        
        if (!toLocation) return null;
        
        // Calculate simple distance
        const dx = toLocation.coordinates.x - fromLocation.coordinates.x;
        const dy = toLocation.coordinates.y - fromLocation.coordinates.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Convert to real-world units (assuming 1 unit = 10 feet)
        const distanceInFeet = distance * 10;
        const distanceInMiles = distanceInFeet / 5280;
        const walkingSpeed = 3; // mph
        const durationInMinutes = Math.round((distanceInMiles / walkingSpeed) * 60);
        
        return {
            from: fromId,
            to: toId,
            distance: Math.round(distanceInMiles * 10) / 10,
            duration: Math.max(1, durationInMinutes),
            difficulty: distanceInFeet < 500 ? 'Easy' : distanceInFeet < 1000 ? 'Medium' : 'Hard',
            steps: this.generateSteps(fromLocation, toLocation)
        };
    },

    generateSteps: function(fromLocation, toLocation) {
        // Generate basic navigation steps
        const steps = [];
        
        steps.push({
            text: `Start at ${fromLocation.name || 'your current location'}`,
            distance: '0 feet',
            icon: '🚶',
            coordinates: fromLocation.coordinates
        });
        
        // Add intermediate steps based on terminal/level changes
        if (fromLocation.terminal !== toLocation.terminal) {
            steps.push({
                text: `Head to Terminal ${toLocation.terminal}`,
                distance: '200 feet',
                icon: '➡️',
                coordinates: { 
                    x: (fromLocation.coordinates.x + toLocation.coordinates.x) / 2,
                    y: fromLocation.coordinates.y
                }
            });
        }
        
        if (fromLocation.level !== toLocation.level) {
            const direction = fromLocation.level < toLocation.level ? 'up' : 'down';
            const icon = direction === 'up' ? '⬆️' : '⬇️';
            steps.push({
                text: `Take escalator ${direction} to ${toLocation.level}`,
                distance: '150 feet',
                icon: icon,
                coordinates: { 
                    x: (fromLocation.coordinates.x + toLocation.coordinates.x) / 2,
                    y: (fromLocation.coordinates.y + toLocation.coordinates.y) / 2
                }
            });
        }
        
        steps.push({
            text: `Arrive at ${toLocation.name}`,
            distance: '0 feet',
            icon: '🎯',
            coordinates: toLocation.coordinates
        });
        
        return steps;
    },

    // Search functionality
    searchLocations: function(query) {
        const searchTerm = query.toLowerCase();
        return Object.values(this.locations).filter(location => 
            location.name.toLowerCase().includes(searchTerm) ||
            location.category.toLowerCase().includes(searchTerm) ||
            location.subcategory.toLowerCase().includes(searchTerm) ||
            location.description.toLowerCase().includes(searchTerm)
        );
    }
};

// Make AIRPORT_DATA globally available
window.AIRPORT_DATA = AIRPORT_DATA;

