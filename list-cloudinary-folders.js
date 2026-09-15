const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: "cxe05iuw",
    api_key: "687449643328226",
    api_secret: "vkqWGM4X_gV42Bcjrky6n2vuC80"
});

async function listSubFolders() {
    try {
        const folder = "suvi_portfolio";

        let folders = [];
        let nextCursor = undefined;

        do {
            const options = {
                max_results: 500
            };

            if (nextCursor) {
                options.next_cursor = nextCursor;
            }

            const result = await cloudinary.api.sub_folders(
                folder,
                options
            );

            folders.push(...result.folders);
            nextCursor = result.next_cursor;

        } while (nextCursor);

        console.log(
            `\n========== FOLDERS INSIDE ${folder} ==========\n`
        );

        if (folders.length === 0) {
            console.log("No subfolders found.");
            return;
        }

        folders.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name}`);
        });

        console.log(`\nTotal subfolders: ${folders.length}`);

    } catch (error) {
        console.error("Failed to get subfolders:");
        console.error(error);
    }
}

listSubFolders();