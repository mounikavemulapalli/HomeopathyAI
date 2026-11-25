const { generateRubricSuggestionsFromCase } = require('../controllers/repertoryController');

async function runTest() {
    const multiSymptomInput = 'weeping tendency, long lasting grief, scanty menses worse by day time, throbbing headache worse by sun heat';

    const req = {
        body: {
            symptoms: multiSymptomInput
        }
    };

    const res = {
        status: function(statusCode) {
            console.log(`Response Status: ${statusCode}`);
            return this;
        },
        json: function(data) {
            console.log("Final Response Data:");
            console.log(JSON.stringify(data, null, 2));

            // Verify iterations and rubrics for each symptom
            const groupedRubrics = data.groupedRubrics;
            const allRetrievedRubrics = data.allRetrievedRubrics;

            console.log("\n--- Verification ---");
            console.log(`Total symptoms processed (from groupedRubrics): ${Object.keys(groupedRubrics).length}`);
            console.log(`Total rubrics accumulated (from allRetrievedRubrics): ${allRetrievedRubrics.length}`);

            const expectedSymptoms = [
                "weeping tendency",
                "long lasting grief",
                "scanty menses worse by day time",
                "throbbing headache worse by sun heat"
            ];

            let allSymptomsFound = true;
            expectedSymptoms.forEach(expectedSymptom => {
                const found = Object.keys(groupedRubrics).some(key => key.includes(expectedSymptom));
                console.log(`Symptom "${expectedSymptom}" found in groupedRubrics: ${found}`);
                if (!found) allSymptomsFound = false;
            });

            if (allSymptomsFound && Object.keys(groupedRubrics).length === expectedSymptoms.length && allRetrievedRubrics.length > 0) {
                console.log("Verification PASSED: All symptoms processed, accumulated, and yielded rubrics.");
            } else {
                console.log("Verification FAILED: Symptom processing or accumulation issue detected.");
            }
        }
    };

    console.log(`Running test with input: "${multiSymptomInput}"`);
    await generateRubricSuggestionsFromCase(req, res);
}

runTest();