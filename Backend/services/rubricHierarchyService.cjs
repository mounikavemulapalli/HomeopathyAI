
// Backend/services/rubricHierarchyService.cjs

const rubricHierarchyService = {};

let nextNodeId = 0;

// Global indexes
global.rubricHierarchy = {}; // Stores all hierarchy nodes keyed by nodeId
global.parentIndex = {};    // childId -> parentId
global.childIndex = {};     // parentId -> [childId1, childId2, ...]
global.pathIndex = {};      // fullPath -> nodeId
global.nodeIndex = {};      // nodeId -> { id, nodeText, fullPath, chapter, parentId, childrenIds, rubricIds, level }


// Function to initialize and build the hierarchy
rubricHierarchyService.buildHierarchy = () => {
    console.log("Building Rubric Hierarchy...");

    // Reset indexes before rebuilding
    nextNodeId = 0;
    global.rubricHierarchy = {};
    global.parentIndex = {};
    global.childIndex = {};
    global.pathIndex = {};
    global.nodeIndex = {};

    if (!global.masterRepertory) {
        console.error("global.masterRepertory is not loaded. Cannot build hierarchy.");
        return;
    }

    const chapters = new Set();
    const rubricPaths = [];

    // First pass: Collect all unique paths and chapters
    Object.values(global.masterRepertory).forEach(rubric => {
        chapters.add(rubric.chapter);
        rubricPaths.push({
            fullPath: rubric.path || rubric.rubric, // Use full hierarchy path
            chapter: rubric.chapter,
            rubricId: rubric.id // Assuming rubric has an id
        });
    });

    // Sort paths to ensure parents are processed before children
    rubricPaths.sort((a, b) => a.fullPath.localeCompare(b.fullPath));

    rubricPaths.forEach(item => {
        const parts = item.fullPath.split(" > ");
        let currentPath = "";
        let parentNodeId = null;

        parts.forEach((part, index) => {
            if (currentPath === "") {
                currentPath = part;
            } else {
                currentPath += " > " + part;
            }

            let nodeId;
            if (global.pathIndex[currentPath]) {
                nodeId = global.pathIndex[currentPath];
            } else {
                nodeId = `node_${nextNodeId++}`;
                global.pathIndex[currentPath] = nodeId;

                const newNode = {
                    id: nodeId,
                    nodeText: part,
                    fullPath: currentPath,
                    chapter: item.chapter, // Chapter is same for all nodes in this path
                    parentId: parentNodeId,
                    childrenIds: [],
                    rubricIds: [],
                    level: index // 0-indexed level
                };
                global.rubricHierarchy[nodeId] = newNode;
                global.nodeIndex[nodeId] = newNode;

                // Update parent-child relationships
                if (parentNodeId) {
                    global.childIndex[parentNodeId] = global.childIndex[parentNodeId] || [];
                    if (!global.childIndex[parentNodeId].includes(nodeId)) {
                        global.childIndex[parentNodeId].push(nodeId);
                    }
                    global.parentIndex[nodeId] = parentNodeId;
                    global.rubricHierarchy[parentNodeId].childrenIds.push(nodeId);
                }
            }

            // If this is the last part of the full rubric path, add the rubricId
            if (index === parts.length - 1) {
                if (!global.rubricHierarchy[nodeId].rubricIds.includes(item.rubricId)) {
                    global.rubricHierarchy[nodeId].rubricIds.push(item.rubricId);
                }
            }

            parentNodeId = nodeId;
        });
    });

    rubricHierarchyService.printStartupStatistics();
    rubricHierarchyService.auditHierarchy();
    console.log("HIERARCHY INDEX READY");
};

rubricHierarchyService.printStartupStatistics = () => {
    const allNodes = Object.values(global.rubricHierarchy);
    const leafNodes = allNodes.filter(node => node.childrenIds.length === 0);
    const parentNodes = allNodes.filter(node => node.childrenIds.length > 0);

    let totalDepth = 0;
    let maximumDepth = 0;
    const chapterCounts = {};

    allNodes.forEach(node => {
        totalDepth += node.level;
        if (node.level > maximumDepth) {
            maximumDepth = node.level;
        }

        if (node.chapter) {
            chapterCounts[node.chapter] = (chapterCounts[node.chapter] || 0) + 1;
        }
    });

    const averageDepth = allNodes.length > 0 ? (totalDepth / allNodes.length).toFixed(2) : 0;

    const sortedChapters = Object.entries(chapterCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 20);

    console.log("------------------------------------------");
    console.log("Hierarchy Statistics:");
    console.log(`Hierarchy Nodes: ${allNodes.length}`);
    console.log(`Leaf Nodes: ${leafNodes.length}`);
    console.log(`Parent Nodes: ${parentNodes.length}`);
    console.log(`Average Depth: ${averageDepth}`);
    console.log(`Maximum Depth: ${maximumDepth}`);
    console.log("Top 20 Chapters:");
    sortedChapters.forEach(([chapter, count]) => {
        console.log(`  ${chapter}: ${count}`);
    });
    console.log("------------------------------------------");
};

rubricHierarchyService.auditHierarchy = () => {
    const allNodes = Object.values(global.rubricHierarchy);
    const rootNodes = allNodes.filter(node => node.parentId === null);
    const leafNodes = allNodes.filter(node => node.childrenIds.length === 0);
    const intermediateNodes = allNodes.filter(node => node.parentId !== null && node.childrenIds.length > 0);

    let deepestHierarchy = 0;
    let totalDepth = 0;
    let nodeCount = 0;

    // Calculate depth for all nodes and total depth for average
    allNodes.forEach(node => {
        let currentDepth = node.level;
        if (currentDepth > deepestHierarchy) {
            deepestHierarchy = currentDepth;
        }
        totalDepth += currentDepth;
        nodeCount++;
    });

    const averageDepth = nodeCount > 0 ? (totalDepth / nodeCount).toFixed(2) : 0;

    // Top 20 most connected nodes (based on number of children)
    const mostConnectedNodes = allNodes
        .sort((a, b) => b.childrenIds.length - a.childrenIds.length)
        .slice(0, 20)
        .map(node => `  ${node.nodeText} (${node.childrenIds.length} children)`);

    console.log("------------------------------------------");
    console.log("Hierarchy Audit:");
    console.log(`How many root nodes?: ${rootNodes.length}`);
    console.log(`How many intermediate nodes?: ${intermediateNodes.length}`);
    console.log(`How many leaf nodes?: ${leafNodes.length}`);
    console.log(`Deepest hierarchy?: ${deepestHierarchy}`);
    console.log(`Average hierarchy depth?: ${averageDepth}`);
    console.log("Top 20 most connected nodes:");
    if (mostConnectedNodes.length > 0) {
        mostConnectedNodes.forEach(nodeInfo => console.log(nodeInfo));
    } else {
        console.log("  No connected nodes found.");
    }
    console.log("------------------------------------------");
};

module.exports = rubricHierarchyService;


