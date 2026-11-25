const fs = require('fs');
const path = require('path');

class DreamsInterpreter {
    constructor() {
        this.dreamProfiles = this.loadDreamProfiles();
    }

    loadDreamProfiles() {
        try {
            const profilesPath = path.join(__dirname, 'dreamProfiles.json');
            return JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
        } catch (error) {
            console.error('Error loading dream profiles:', error);
            return {};
        }
    }

    interpret(dreams) {
        if (!dreams || typeof dreams !== 'string' || dreams.trim() === '') {
            return { handled: false };
        }

        const lowerCaseDreams = dreams.toLowerCase();

        for (const category in this.dreamProfiles) {
            for (const dreamKey in this.dreamProfiles[category]) {
                const profile = this.dreamProfiles[category][dreamKey];
                for (const searchTerm of profile.searchTerms) {
                    if (lowerCaseDreams.includes(searchTerm.toLowerCase())) {
                        return {
                            handled: true,
                            canonicalSymptom: profile.canonicalSymptom,
                            primaryChapter: profile.primaryChapter,
                            secondaryChapters: profile.secondaryChapters || [],
                            searchTerms: profile.searchTerms,
                            confidence: profile.confidence,
                            matchType: profile.matchType
                        };
                    }
                }
            }
        }
        return { handled: false };
    }
}

module.exports = DreamsInterpreter;