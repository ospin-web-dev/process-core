const { TYPES } = require('./Gateways')
const createDefaultGatewayInterface = require('./createDefaultGatewayInterface')

/**
  * @function getAll
  * @memberof Workflow.AndMergeGateway
  * @arg {Object} workflow
  * @desc returns all gateways of type AND_MERGE
  */

/**
  * @function add
  * @memberof Workflow.AndMergeGateway
  * @arg {Object} workflow
  * @arg {Object} initialData
  * @desc adds a new AND_MERGE gateway to the workflow
  */

/**
  * @function remove
  * @memberof Workflow.AndMergeGateway
  * @arg {Object} workflow
  * @arg {id} id
  * @desc removes an AND_MERGE gateway from the workflow
  */

const defaultInterface = createDefaultGatewayInterface(TYPES.AND_MERGE)

delete defaultInterface.update

module.exports = defaultInterface
