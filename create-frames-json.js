const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: "cxe05iuw",
    api_key: "687449643328226",
    api_secret: "vkqWGM4X_gV42Bcjrky6n2vuC80"
});

async function checkImages() {
    try {

        let resources = [];
        let nextCursor = undefined;

        do {

            const options = {
                type: "upload",
                resource_type: "image",
                max_results: 500
            };

            if (nextCursor) {
                options.next_cursor = nextCursor;
            }

            const result =
                await cloudinary.api.resources(options);

            resources.push(...result.resources);

            nextCursor = result.next_cursor;

        } while (nextCursor);

        console.log(
            `\nTotal images found: ${resources.length}\n`
        );

        // Show all frame images
        const frameImages = resources.filter(resource =>
            /frame_\d+/i.test(resource.public_id)
        );

        console.log(
            `Frame images found: ${frameImages.length}\n`
        );

        frameImages.forEach((image, index) => {

            console.log(
                `${index + 1}. ${image.public_id}.${image.format}`
            );

        });

        console.log("\n========== ALL IMAGES ==========\n");

        resources.forEach((image, index) => {

            console.log(
                `${index + 1}. ${image.public_id}.${image.format}`
            );

        });

    } catch (error) {

        console.error("Cloudinary error:");
        console.error(error);

    }
}

checkImages();