import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    /*
    1-verify videoId
    2-match comment for videoId
    3-pagination
    4-add number of likes for the comment from like model
    5-sort by date descending
    6-return comments
    */
    const pageNum = Number(page)
    const limitNum = Number(limit)

    if (!videoId || !pageNum || !limitNum || pageNum === 0) {
        throw new ApiError(400, "Please provide a valid input")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const getComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip: (pageNum - 1) * limitNum
        },
        {
            $limit: limitNum
        },
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
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "totalLikesOnComment"
            }
        },
        {
            $addFields: {
                likedByUser: {
                    $in: [req.user?._id, "$totalLikesOnComment.likedBy"]
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                content: { $first: "$content" },
                video: { $first: "$video" },
                owner: { $first: "$owner" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                totalLikesOnComment: { $sum: { $size: "$totalLikesOnComment" } },
                likedByUser: { $first: "$likedByUser" }
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                isOwner: {
                    $cond: {
                        if: { $eq: [req.user?._id, { $arrayElemAt: ["$owner._id", 0] }] },
                        then: true,
                        else: false
                    }
                }
            }
        },
    ])

    if (!getComments?.length) {
        throw new ApiError(404, "No comments found for this video. Or, you may try a lower page number.")
    }

    return res.status(200).json(new ApiResponse(200, getComments, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    /*
    1-get user from req
    2-get vedioId and check; get comment text and check 
    3-create new comment with user and video id
    4-check if comment created
    5-return posted comment
    */
    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content can't be empty")
    }

    const user = req.user?._id

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "This video does not exist")
    }

    const comment = await Comment.create({
        content,
        video,
        owner: user
    })

    const postedComment = await Comment.findById(comment._id)

    if (!postedComment) {
        throw new ApiError(500, "Something went wrong while posting a comment")
    }

    return res.status(201).json(new ApiResponse(200, postedComment, "Comment posted successfully."))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    /*
    1-get user from req
    2-get commentId and check for valid commentId and then for valid comment owner
    3-find the new comment  data in body
    4-update the comment with new data
    5-return updated comment
    */
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content can't be empty")
    }

    const commentOwner = await Comment.findById(commentId)

    if (!commentOwner) {
        throw new ApiError(404, "This comment does not exist")
    }

    if (commentOwner.owner.toString() != req.user?._id.toString()) {
        throw new ApiError(400, "You are not the owner of this comment to edit")
    }

    try {
        const comment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set: {
                    content: content
                }
            },
            { new: true }
        )

        return res.status(200).json(new ApiResponse(200, comment, "Comment has been updated successfully."))
    } catch (error) {
        throw new ApiError(500, "Unable to update comment")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    /*
    1-get user from req
    2-get commentId and check for valid commentId and then for valid comment owner
    3-delete the comment
    4-return deleted comment success msg
    */
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findById(commentId)
    
    if (!comment) {
        throw new ApiError(404, "This comment does not exist")
    }

    if (comment.owner.toString() != req.user?._id.toString()) {
        throw new ApiError(400, "You are not the owner of this comment to delete")
    }

    try {
        await Comment.findByIdAndDelete(commentId)
        // Delete likes of deleted comment
        await Like.deleteMany({ comment: comment._id });

        return res
            .status(200)
            .json(new ApiResponse(200, "comment deleted successfully"))
    } catch (error) {
        throw new ApiError(500, "Unable to delete comment")
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }
