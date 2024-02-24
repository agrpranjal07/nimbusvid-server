import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const options = {
    httpOnly: true,
    secure: true
}
const generateAccessTokenAndRefereshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken= user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}


const registerUser = asyncHandler( async(req,res)=>{
    //get user details from frontend ✅
    //validation - not empty ✅
    //check if user already exist: username, email ✅
    //chek for images, check for avatar ✅
    //upload them to cloudinary, avatar ✅
    //create user object - create entry in db✅
    // remove password and refresh token field from response✅
    //check for user creation✅
    // return res✅


    const {fullName, email, username , password} = req.body; 
     //console.log("fullName:", fullName);

    if (
        [fullName, email , username, password].some((field)=> field?.trim() === "")
    ){
        throw new  ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{username}, {email}]
        })
        // console.log(existedUser)

    if (existedUser) {
        throw new ApiError(409,"User with email or username already existed")
    }
// console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length  > 0){
        coverImageLocalPath= req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,'Avatar is required')
    }
    console.log(avatarLocalPath, coverImageLocalPath);
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await  uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,'Avatar is not uploaded')
    }

    const user = await User.create({
        fullName,
        avatar:  avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500,"Server error while creating a user")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User Registered Successfully")
   )

} )

const loginUser = asyncHandler( async(req,res)=>{
    //get username|| email && password  from the request body
    //check for username (if no) => ask to register
    // (if yes)check password in database (if no)  => wrong credentials
    //if yes => generate access and refresh token
    //send cookie

    const { email, username , password} = req.body; 
    console.log(req.body);
    if (!(username || email)) {
        throw new ApiError(400,"username or email is required for login")
    }

   const user= await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new ApiError(401, "Incorrect Password")
    }

    const {accessToken, refreshToken}=await generateAccessTokenAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user.id).select("-password -refreshToken")


    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user: loggedInUser, accessToken,refreshToken
            }, 
            'Logged In Successfully'
        )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
                    }
            
        },
        {
            new:true
        }

    )


    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,"Successfully Logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        if (!incomingRefreshToken){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refreshToken")
        }
        
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const {accessToken, newRefreshToken}=await generateAccessTokenAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken", newRefreshToken,refreshOptions)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "New Access Token Generated"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}