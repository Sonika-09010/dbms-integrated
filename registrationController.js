const registerForConference = async (req, res) => {
    try {
        const {
            conference_id,
            registration_type
        } = req.body;

        if (!conference_id || !registration_type) {
            return res.status(400).json({
                message: "Conference ID and registration type are required"
            });
        }

        res.status(201).json({
            message: "Conference registration received",
            registration: {
                user_id: req.user.user_id,
                conference_id,
                registration_type,
                status: "Pending"
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Conference registration failed"
        });
    }
};

const getMyRegistrations = async (req, res) => {
    try {
        res.json({
            message: "Registration history endpoint",
            user_id: req.user.user_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch registrations"
        });
    }
};

module.exports = {
    registerForConference,
    getMyRegistrations
};