const createSession = async (req, res) => {
    try {
        const {
            conference_id,
            title,
            description,
            start_time,
            end_time,
            location
        } = req.body;

        if (
            !conference_id ||
            !title ||
            !start_time ||
            !end_time
        ) {
            return res.status(400).json({
                message:
                    "Conference ID, title, start time and end time are required"
            });
        }

        res.status(201).json({
            message: "Conference session received",
            session: {
                conference_id,
                title,
                description: description || null,
                start_time,
                end_time,
                location: location || null
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create session"
        });
    }
};

const getSessions = async (req, res) => {
    try {
        const { conference_id } = req.params;

        if (!conference_id) {
            return res.status(400).json({
                message: "Conference ID is required"
            });
        }

        res.json({
            message: "Conference sessions endpoint",
            conference_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch sessions"
        });
    }
};

const addKeynoteSpeaker = async (req, res) => {
    try {
        const {
            conference_id,
            name,
            email,
            organization,
            topic
        } = req.body;

        if (!conference_id || !name || !topic) {
            return res.status(400).json({
                message:
                    "Conference ID, speaker name and topic are required"
            });
        }

        res.status(201).json({
            message: "Keynote speaker received",
            speaker: {
                conference_id,
                name,
                email: email || null,
                organization: organization || null,
                topic
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to add keynote speaker"
        });
    }
};

module.exports = {
    createSession,
    getSessions,
    addKeynoteSpeaker
};