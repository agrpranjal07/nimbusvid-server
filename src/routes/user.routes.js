import { Router } from "express";
import { loginUser, 
    logoutUser, 
    refreshAccessToken,
    registerUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage, 
    getUserChannelProfile,
    getWatchHistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router =  Router();

router.route("/register").post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
        registerUser
    )

router.route("/login").post(loginUser) 

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/changePassword").post(verifyJWT , changeCurrentPassword)

router.route("/currentUser").post(verifyJWT , getCurrentUser)

router.route("/updateDetail").patch(verifyJWT , updateAccountDetails)

router.route("/updateAvatar").patch(verifyJWT , upload.single("avatar"),updateUserAvatar)

router.route("/updateCoverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)

export default router