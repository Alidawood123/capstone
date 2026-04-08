# Arc Wellness
The source code for our SAIT Capstone project. This is an app about tracking workout sessions. User can add exercises or creating their own and do their workout with our app, there is also a rest timer for the user to time their rest. User can also create templates and do their exercises instantly. Their workout sessions will be saved and can be viewed according to the dates.

The app can also analyze workout videos uploaded by the users using AI. It will extract all of the exercises that have been performed in the video and if the exercises involves weights it can estimate the weights as well.

## How to run
First here is all of the repo that you will need in order to run the app
1. trainsight-ai
2. arcwellness-backend
3. capstone (this repo)
4. arcwellness-admin (optional)

Each of them should have their own ``README.md`` file with instructions of how to run them

There is also one service that you need to setup for the project as well. Which is Firebase, specifically Firebase Authentication. You will need to enable Email/Password Authentication, Google, Facebook, Apple Authentication as well. Beside that just download all of the ``google-services.json`` and ``GoogleService-Info.plist`` file and put it in the root of the project. Then make a copy of ``.env.sample`` fill out everything that needs to be fill out in the sample file and rename it to ``.env``

Finally here is the command that you need to run for Android Emulator
```shell
# Install all of the necessary dependencies for the project
npm install 

# Prebuild to generate some important files
npx expo prebuild --clean

# Building and running the project
npx expo run:android
```

Alternatively, we have setup Expo Application Services and you can use it to build on the cloud and just download the finished build either on Android or IOS
