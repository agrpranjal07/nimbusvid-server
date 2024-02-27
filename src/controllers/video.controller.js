import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js" 
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination✅
    try {

        const sortTypeNum = Number(sortType)  || -1;
        const pageNum = Number(page) 
        const limitNum = Number(limit)
        
        if (userId && !isValidObjectId(userId)) {
          throw new ApiError(400, "Invalid user ID");
        }
        await Video.createIndexes({ title: "text", description: "text" });
        
        const getVideos = await Video.aggregate([
            {   
                /*
                (1)fiter on the basis 
                    (a)whether the user exists
                    (b)whether video is published or not
                    (c)of given query
                (2)added sortby:
                    (a)by adding a field for the sort by info
                    (b)if no sortby than add createdAt
                    (c)sort with sortby passing sortTypeNum
                (3)get videos, owner, matchedVideosCount
                    (a)for pagination skip (page-1)*limit and then limit=limit
                    (b)use lookup for users  to get username, avatar, createdAt, updatedAt of the creator of the video
                    (c)use $count 
                */

                    $match: {
                        owner: userId ? userId : "",
                        isPublished: true,
                       
                        $text: {
                          $search:  query ? query : ""
                        }
                      }},
            {
                $addFields: {
                    sortField: { $toString: "$" + (sortBy  || 'createdAt') }
                }
            },
            {
                $facet:{
                   videos: [
                    {
                        $sort: { sortField: sortTypeNum}
                   },
                   {
                        $skip:  (pageNum - 1) * limitNum
                   },
                   {
                        $limit: limitNum
                   },
                   {
                        $lookup:{
                            from : "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        createdAt: 1,
                                        updatedAt: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    },
                ],
                matchedVideosCount: [
                    { $count: "videos" }
                ]
                }
            }
        ])
        
        // console.log(getVideos);
        if (!getVideos[0]?.videos?.length ) {
            throw new ApiError(402, "You should try lower page number")
        }

        if(!getVideos[0]?.matchedVideosCount?.length){
            throw new ApiError(403, "no vedio for this query")
        }

        res
        .status(200)
        .json(new ApiResponse(200,getVideos[0],"All video found Successfully "));
      } catch (error) {
        throw new ApiError(402,error,"Can't get videoes"); // Pass error to error handler middleware
      }
    }
    
)

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video✅
    /*
    1-Check for all required feilds(title,description,video file,thumbnail)
    2-Upload the image and video using clodinary 
    3-get user
    4-create a new video model with the uploaded data
    */

    if(!title || !description){
        throw new ApiError(402,"Title or Description missing")
    }
    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if(!videoFileLocalPath){
        throw new ApiError(403, "Video file not uploaded.")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(403,"Thumbnail not found")
    }
    const videoFile= await uploadOnCloudinary(videoFileLocalPath);

    if(!videoFile.url) {
        throw new ApiError(404,"Could not upload the videoFile")
    };

    const thumbnail= await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail.url) {
        throw new ApiError(404,"Could not upload the thumbnail")
    };

    
    const  user = req.user?._id
    const uploadVideo= await Video.create(
        {
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            title,
            description,
            duration: videoFile.duration,
            owner: user
        }
    )
    
    const uploadedVideo = await  Video.findById(uploadVideo._id);

    if(!uploadedVideo){
        throw new ApiError(500,'Video is not uploaded')
    }

    res.status(201).json(new ApiResponse(202,uploadedVideo,"Vedio Published Successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id✅
    /*
    1- check if it exists in database or not
    2- increase views
    3- add owner,likes, comments, subscribers and subscription and like status of this user
    */

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    })

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
                isPublished: true
            }
        },
        {
            $facet: {
                getAVideo: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                        createdAt: 1,
                                        updatedAt: 1
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
                ],
                totalLikesCommentsAndSubscription: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "totalLikesOnVideo"
                        }
                    },
                    {
                        $addFields: {
                            likedByUser: {
                                $in: [req.user?._id, "$totalLikesOnVideo.likedBy"]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "comments",
                            localField: "_id",
                            foreignField: "video",
                            as: "totalComments"
                        },
                    },
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "owner",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            isSubscribedTo: {
                                $in: [req.user?._id, "$subscribers.subscriber"]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            TotalLikesOnVideo: { $sum: { $size: "$totalLikesOnVideo" } },
                            TotalComments: { $sum: { $size: "$totalComments" } },
                            TotalSubscribers: { $sum: { $size: "$subscribers" } },
                            isSubscribedTo: { $first: "$isSubscribedTo" },
                            likedByUser: { $first: "$likedByUser" }
                        }
                    }
                ]
            }
        },
    ])
    if (!video[0].getAVideo.length) {
        throw new ApiError(404, "Video does not exist")
    }
    // add videoId to watchHistory of the user
    const user = await User.findById(req.user?._id)
    const matchedVideo = user.watchHistory.find((video) => video.equals(videoId));

    if (!matchedVideo) {
        user.watchHistory.push(videoId)
        await user.save();
    }

    return res.status(200).json(new ApiResponse(200, video[0], "video fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail✅
    /*
    1- Check credebility
    2- Find the video by its id 
    3- Update it with the provided
    4- If thumbnail -> mantain cloudinary
    */
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path


    if ((!title || title.trim() === "") && (!description || !description.trim() === "") && !thumbnailLocalPath) {
        throw new ApiError(400, "Atleast one field is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "This video not exists")
    }

    if (req.user?._id.toString() != video.owner.toString()) {
        throw new ApiError(400, "You are not allowed to edit this video")
    }
    let thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(thumbnailLocalPath)
    {
    if (!thumbnail.url) {
        throw new ApiError(500, "Error while uploading the thumbnail and getting the URL")
    }
    const thumbnailOldUrl = video.thumbnail;
    if (thumbnailOldUrl != "") {
    await deleteOnCloudinary(thumbnailOldUrl);
    }}
    try {
        let updatedVideo;
        if(title){updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    title: title
                }
            },
            { new: true }
        )}
        if(description){updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    description: description
                }
            },
            { new: true }
        )}
        if(thumbnail &&  thumbnail.url){updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    thumbnail: thumbnail.url
                }
            },
            { new: true }
        )}


        return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
    } catch (error) {
       
        if (thumbnail && thumbnail.url) {
          await  deleteOnCloudinary(thumbnail.url)
        }
        throw new ApiError(500, "Error while updating the thumbnail")
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video✅
    /*
    1- Check credebility
    2- Delete likes on comments,likes on video, comments on video
    3- Delete video from database
    4- Delete image and video on cloudinary 
    */
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "This video does not exist")
    }

    if (req.user?._id.toString() != video.owner.toString()) {
        throw new ApiError(400, "You are not the owner to delete this video")
    }
    const session = await mongoose.startSession();
    try {await session.withTransaction(async () => {
        // delete likes on video comments
        const comments = await Comment.find({ video: video._id });
        const likes = await Like.find({ video: video._id });
        console.log(comments);
        // Delete comments and likes on the video, and then delete the video
        await Comment.deleteMany({ _id: { $in: comments.map(comment => comment._id) } });
        await Like.deleteMany({ _id: { $in: likes.map(like => like._id) } });
        await Video.findByIdAndDelete(videoId);
});
        await session.commitTransaction();
    }
        catch (error) {
        await session.abortTransaction(); 
        
            throw new ApiError(500, "Unable to delete video")
        }
        finally {
            await session.endSession()}
            

        const videoUrl = video.videoFile
        const thumbnailUrl = video.thumbnail
        if (videoUrl) {
         await   deleteOnCloudinary(videoUrl)
        }

        if (thumbnailUrl) {
          await  deleteOnCloudinary(thumbnailUrl)
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Video deleted successfully"))
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    /*Todo: toggle publish status✅
    1-Check credebility
    2-toggle status
     */
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "This video does not exist")
    }

    if (req.user?._id.toString() != video?.owner.toString()) {
        throw new ApiError(400, "You are not the owner to change the publish status of this video")
    }

    try {
        const updatedPublishStatus = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    isPublished: !video.isPublished
                }
            }, { new: true }
        );

        return res.status(200).json(new ApiResponse(200, updatedPublishStatus, "Video published status changed successfully"))
    } catch (error) {
        throw new ApiError(500, "Unable to change video published status")
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
