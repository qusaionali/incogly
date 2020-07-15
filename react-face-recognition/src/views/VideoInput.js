import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Webcam from 'react-webcam';
import { loadModels, getFullFaceDescription, getFaceExpressions, createMatcher } from '../api/face';

import Avatar,{Piece} from 'avataaars';
// Import face profile

const JSON_PROFILE = require('../descriptors/bnk48.json');



const WIDTH = 1000;
const HEIGHT = 1000;
const inputSize = 160;
const randomChoice = array => array[Math.floor(Math.random() * array.length)];
const clothes = randomChoice(['BlazerShirt', 'BlazerSweater', 'CollarSweater', 'Hoodie', 'Overall'])
const top = randomChoice(['NoHair', 'EyePatch','LongHairMiaWallace', 'Hat', 'Hijab', 'Turban', 'WinterHat1', 'LongHairBigHair', 'ShortHairSides', 'ShortHairFrizzle'])
const accessories = randomChoice(['Blank', 'Kurt', 'Prescription01', 'Prescription02', 'Round', 'Wayfarers'])
const skinColor = randomChoice(['Light', 'Pale', 'Brown', 'Yellow', 'Tanned', 'DarkBrown', 'Black'])

class VideoInput extends Component {
  constructor(props) {
    super(props);
    this.webcam = React.createRef();
    this.state = {
      fullDesc: null,
      detections: null,
      descriptors: null,
      faceMatcher: null,
      match: null,
      facingMode: null,
      expression: null,
      video: true
    };
  }

  componentWillMount = async () => {
    await loadModels();
    this.setState({ faceMatcher: await createMatcher(JSON_PROFILE) });
    this.setInputDevice();
  };

  setInputDevice = () => {
    navigator.mediaDevices.enumerateDevices().then(async devices => {
      let inputDevice = await devices.filter(
        device => device.kind === 'videoinput'
      );
      if (inputDevice.length < 2) {
        await this.setState({
          facingMode: 'user'
        });
      } else {
        await this.setState({
          facingMode: { exact: 'environment' }
        });
      }
      this.startCapture();
    });
  };

  startCapture = () => {
    this.interval = setInterval(() => {
      this.capture();
    }, 1500);
  };

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  //Facial Expressions
  capture = async () => {
    if (!!this.webcam.current) {
      await getFaceExpressions(
        this.webcam.current.getScreenshot(),
        inputSize
      ).then(resizedResults => {
        if (!!resizedResults) {
          const minConfidence = 0.05
          const exprObj = resizedResults[0] && resizedResults[0].expressions.filter(expr => expr.probability > minConfidence);
          let maxCallback = ( acc, cur ) => {
            acc['expression'] = acc.probability > cur.probability ? acc.expression : cur.expression
            acc['probability'] = Math.max( acc.probability, cur.probability )
            return acc;
          };

          const output = exprObj && exprObj.reduce(maxCallback);
          this.setState({
            expression: output
          })
        }
      });
    }
  };

//Track avatar and movements
  // capture = async () => {
  //   if (!!this.webcam.current) {
  //     await getFullFaceDescription(
  //       this.webcam.current.getScreenshot(),
  //       inputSize
  //     ).then(fullDesc => {
  //       if (!!fullDesc) {
  //         this.setState({
  //           detections: fullDesc.map(fd => fd.detection),
  //           descriptors: fullDesc.map(fd => fd.descriptor)
  //         });
  //       }
  //     });

  //     if (!!this.state.descriptors && !!this.state.faceMatcher) {
  //       let match = await this.state.descriptors.map(descriptor =>
  //         this.state.faceMatcher.findBestMatch(descriptor)
  //       );
  //       this.setState({ match });
  //     }
  //   }
  // };

  render() {
    const { detections, match, facingMode } = this.state;



    let videoConstraints = null;
    let camera = '';
    if (!!facingMode) {
      videoConstraints = {
        width: WIDTH,
        height: HEIGHT,
        facingMode: facingMode
      };
      if (facingMode === 'user') {
        camera = 'Front';
      } else {
        camera = 'Back';
      }
    }

    let drawBox = null;
    if (!!detections) {
      drawBox = detections.map((detection, i) => {
        let _H = detection.box.height;
        let _W = detection.box.width;
        let _X = detection.box._x;
        let _Y = detection.box._y;
        return (
          <div key={i} >
              {!!match && !!match[i] ? (
                      <div style={{width: WIDTH, height: 600, backgroundColor: 'black', position: 'absolute', zIndex: 2}}>
                        {/*TODO: Replacement for the hardcoded translateX center value */}
                        <Avatar
                        style={{width: 300, height: 600, transform:  `translateX(${(350) - _X}px)`, marginBottom: 0,}}
                        avatarStyle='Square'
                        topType={top}
                        accessoriesType={accessories}
                        hairColor='BrownDark'
                        facialHairType='Blank'
                        clotheType={clothes}
                        clotheColor='PastelBlue'
                        eyeType='Happy'
                        eyebrowType='Default'
                        mouthType='Twinkle'
                        skinColor={skinColor}
                      />
                      </div>
              ) : null
              }
          </div>
              
        );
      });
    }

    return (
      <div
        className="Camera"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <p>Camera: {camera}</p>
        <div
          style={{
            width: WIDTH,
            height: HEIGHT
          }}
        >
          <div style={{ position: 'relative', width: WIDTH }}>
            <div style={{width: WIDTH, height: 600, backgroundColor: 'black', position: 'absolute', zIndex: 2}}></div>
            {!!videoConstraints ? (
              <div style={{ position: 'absolute'}}>
                <Webcam
                  audio={false}
                  width={WIDTH}
                  height={600}
                  ref={this.webcam}
                  mirrored
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  style={{zIndex: -1}}
                />
              </div>
            ) : null}
            {!!drawBox ? drawBox : null}
          </div>
          
        </div>
      </div>
    );
  }
}

export default withRouter(VideoInput);