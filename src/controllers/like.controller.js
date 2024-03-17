import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet }  from '../models/tweet.model.js'
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    /*
    1- Check if videoId is valid or not
    2- If already liked then remove from database
    3- If not then add in database
    */
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "This video does not exist")
    }

    const loggedInUser = req.user?._id
    const videoIsLiked = await Like.findOneAndDelete(
        { likedBy: loggedInUser, video: video }
    )

    if (videoIsLiked) {
        return res.status(200).json(new ApiResponse(200, "Your like has been removed, from this video"))
    }

    if (!videoIsLiked) {
        const videoLike = await Like.create({
            likedBy: loggedInUser,
            video
        })

        const createdLikedVideo = await Like.findById(videoLike._id)

        if (!createdLikedVideo) {
            throw new ApiError(500, "Something went wrong while liking this video")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, createdLikedVideo, "video Liked successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    /*
    1- Check if commentId is valid or not
    2- If already liked then remove from database
    3- If not then add in database
    */
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "This comment does not exist")
    }

    const loggedInUser = req.user?._id
    const commentIsLiked = await Like.findOneAndDelete(
        { likedBy: loggedInUser, comment: comment }
    )

    if (commentIsLiked) {
        return res.status(200).json(new ApiResponse(200, "Your like has been removed, from this comment"))
    }

    if (!commentIsLiked) {
        const commentLike = await Like.create({
            likedBy: loggedInUser,
            comment
        })

        const createdLikedComment = await Like.findById(commentLike._id)

        if (!createdLikedComment) {
            throw new ApiError(500, "Something went wrong while liking this comment")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, createdLikedComment, "comment Liked successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    /*
    1- Check if tweetId is valid or not
    2- If already liked then remove from database
    3- If not then add in database
    */
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "This tweet does not exist")
    }

    const loggedInUser = req.user?._id
    const tweetIsLiked = await Like.findOneAndDelete(
        { likedBy: loggedInUser, tweet: tweet }
    )

    if (tweetIsLiked) {
        return res.status(200).json(new ApiResponse(200, "Your like has been removed, from this tweet"))
    }

    if (!tweetIsLiked) {
        const tweetLike = await Like.create({
            likedBy: loggedInUser,
            tweet
        })

        const createdLikedTweet = await Like.findById(tweetLike._id)

        if (!createdLikedTweet) {
            throw new ApiError(500, "Something went wrong while liking this tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, createdLikedTweet, "tweet Liked successfully"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    /*
    match for this user in like database --> lookup for video if videos database --> in each video add owner(by lookup in user databse)-->send the res
    */
    const userId = req.user?._id

    const getLikedVideos = await Like.aggregate([
        {
            $match: {
                video: { $exists: true },
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: {
                    $first: "$video"
                }
            }
        }
    ])

    if (!getLikedVideos?.length) {
        throw new ApiError(404, "You haven't liked any videos yet")
    }

    return res.status(200).json(new ApiResponse(200, getLikedVideos, "Liked videos fetched successfully"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}