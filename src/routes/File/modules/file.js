/********************************************************
 * FileReducer
 *
 * Will handle the actions and state surrounding the
 * fetch and render of remote file contents.
 *
 * @flow
 ********************************************************/
import { API_ROOT, TOKEN } from '~/config/api'
import { PROJECT } from '~/db/schema'

const initialState = {
  isFetching: true,
  content: "",
  path: "",
  sha: "",
  commitMessage: ""
}

//////////////////////////////////////////
//	All of the incoming requests to
//	populate our data.
//////////////////////////////////////////

const REQUEST_PATH = 'REQUEST_PATH'
const RECEIVE_PATH = 'RECEIVE_PATH'
const PATH_FAIL    = 'PATH_FAIL'
const DECODE_PATH  = 'DECODE_PATH'
const LOAD_PATH = 'LOAD_PATH'

export function loadPath() {
  return {
    type: 'LOAD_PATH',
    }
}

export function decodePath(data) {
  return {
    type: 'DECODE_PATH',
    content: data, 
    }
}

export function requestPath() {
  return {
    type: 'REQUEST_PATH',
    }
}
export function receivePath(sha, path) {
  return {
    type: 'RECEIVE_PATH',
    sha: sha,
    path: path
    }
}
export function pathFail(data) {
  return {
    type: 'PATH_FAIL',
    error: data
    }
}

export function fetchPath(path) {
  return dispatch => { // return redux-thunk
    dispatch(requestPath()) // set state to fetching
    return fetch(`${API_ROOT}/${PROJECT.full_name}/contents/${path}`, {
      method: "GET",
      })
      .then((response) => {
        if (response.ok) {
          return response.json()
        } else {
          return null
        }
        })
        .then((file) => {
          dispatch(receivePath(file.sha, file.path))
          return file
        })
        .then((file)  => Buffer.from(file.content, 'base64').toString('ascii') )
        .then((content) => {
          dispatch(decodePath(content))
          return content
        })
      .then(() => dispatch(loadPath()))
      .catch((err) => console.error(err))
  }
}

//////////////////////////////////////////
//	All of the outbound requests to 
//	interface with Github and other
//	external resources
//////////////////////////////////////////

const POST_FILE            = 'POST_FILE'
const RECEIVE_UPDATED_FILE = 'RECEIVE_UPDATED_FILE'

export function postFile() {
  return {
    type: 'POST_FILE',
    }
}

export function receiveUpdatedFile(sha, path) {
  return {
    type: 'RECEIVE_UPDATED_FILE',
    sha: sha,
    path: path
    }
}

export function updateFile(content, sha, path, message) {
  return dispatch => { // return redux-thunk
    dispatch(postFile()) // set state to fetching
    return fetch(`${API_ROOT}/${PROJECT.full_name}/contents/${path}`, {
      method            : "PUT",
      headers           : {
        "Content-Type"  : "application/json",
        "Authorization" : `token ${TOKEN}`
      },
      body: JSON.stringify({
        "message": "RCTCommit",
        "committer": {
          "name" : `${PROJECT.current_user.name}`,
          "email": `${PROJECT.current_user.email}`
        },
        "content": new Buffer(content).toString('base64'),
        "sha": sha
      })
    })
    .then((response) => {
      if (response.ok) {
        return response.json()
      } else {
        return null
      }
    })
    .then((data) => dispatch(receiveUpdatedFile(data)))
    .then((data) => dispatch(fetchFile(`${path}`)))
  }
}



export default function file (state = initialState, action) {
  switch (action.type) {
  case REQUEST_PATH :
    return {
    ...state,
    content: "",
    isFetching: true
  }
  case RECEIVE_PATH :
    return {
    ...state,
    sha: action.sha,
    path: action.path
  }
  case DECODE_PATH :
    return {
    ...state,
    content: action.content
  }
  case PATH_FAIL :
    return {
    ...state,
    isFetching: false,
    fileError: action.error
  }
  case POST_FILE :
    return {
    ...state,
    isFetching: true
  }
  case RECEIVE_UPDATED_FILE :
    return {
    ...state,
    sha: action.sha,
    path: action.path
  }
  case LOAD_PATH :
    return {
    ...state,
    isFetching: false,
  }
    default :
      return state
  }
}