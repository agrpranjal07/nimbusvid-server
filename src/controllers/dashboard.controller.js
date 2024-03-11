import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    /*
    1-get user from req
    2-for video stats apply aggregate pipeline in video database
        a-match for owner by user
        b-lookup for total comments from comment database
        c-lookup for total likes from like database
        d- group by _id null, sum of all VideoCount, sum of Views On Videos,sum of Comments On Videos,sum of Likes On Videos
    3-for total subscribers apply aggregate on Subscription database
        a-match for channel by user
        b-group by _id null, use sum for total subscribers
    4-destructure above objects and combine in one object
    5-send response with combined stats
    */
    const user = req.user?._id

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user)
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "totalComments",
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "totalLikesOnVideos"
            }
        },
        {
            $group: {
                _id: null,
                TotalVideosCount: { $sum: 1 },
                TotalViewsOnVideos: { $sum: "$views" },
                TotalCommentsOnVideos: { $sum: { $size: "$totalComments" } },
                TotalLikesOnVideos: { $sum: { $size: "$totalLikesOnVideos" } }
            }
        }
    ])

    const subscriptionStats = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(user)
            }
        },
        {
            $group: {
                _id: null,
                TotalSubscribersCount: { $sum: 1 }
            }
        }
    ])

    // Combined stats using the spread operator
    const combinedStats = {
        ...videoStats[0],
        ...subscriptionStats[0]
    };
    if(!combinedStats?.length){
        throw new ApiError(400,"Stats undefined")
    }

    return res.status(200).json(new ApiResponse(200, combinedStats, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    /*
    1-Get user from request
    2-get video from video database  using match by user and also add total likes and comments
    3-send  response with videos data
    */
    const user = req.user?._id

    const videos = await Video.aggregate([
        {
            $match: {
                owner: user
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "totalLikes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "totalComments"
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$totalLikes"
                },
                totalComments: {
                    $size: "$totalComments"
                }
            }
        }
    ])

    if (!videos?.length) {
        throw new ApiError(404, "You haven't uploaded a video yet.")
    }

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }