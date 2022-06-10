const ElementsHandler = require('../ElementsHandler')
const EventListeners = require('../eventListeners/EventListeners')

const Phase = require('./Phase')
const Command = require('./commands/Command')

const NoPhasesError = require('../../validator/errors/NoPhasesError')

class Phases extends ElementsHandler {

  static get COLLECTION_NAME() {
    return 'phases'
  }

  static get ID_PREFIX() {
    return 'phase'
  }

  static getInterface() {
    return Phase
  }

  static add(workflow, data = {}) {
    return this.addElement(workflow, Phase, data)
  }

  static isLastPhase(workflow) {
    return this.getAll(workflow).length === 1
  }

  static remove(workflow, phaseId) {
    if (Phases.isLastPhase(workflow)) {
      throw new NoPhasesError()
    }
    let wfWithoutPhase = this.removeElement(workflow, phaseId)
    const eventListeners = EventListeners.getManyBy(wfWithoutPhase, { phaseId })

    if (eventListeners.length) {
      eventListeners.forEach(listener => {
        wfWithoutPhase = EventListeners.remove(wfWithoutPhase, listener.id)
      })
    }

    return wfWithoutPhase
  }

  static update(workflow, id, data) {
    return this.updateElement(workflow, id, data)
  }

  static getExistingPhaseCommandIds(workflow, id) {
    const phase = this.getById(workflow, id)
    return phase.commands.map(command => command.id)
  }

  static generateUniqueCommandId(workflow, id) {
    const existingIds = this.getExistingPhaseCommandIds(workflow, id)
    let counter = 0
    const prefix = 'command'
    let newId = `${prefix}_${counter}`

    while (existingIds.includes(newId)) {
      counter += 1
      newId = `${prefix}_${counter}`
    }

    return newId
  }

  static addCommand(workflow, id, command) {
    const phase = this.getById(workflow, id)
    const commandWithId = { ...command, id: Phases.generateUniqueCommandId(workflow, id) }
    return this.update(workflow, id, { commands: [ ...phase.commands, commandWithId ] })
  }

  static updateCommand(workflow, id, updatedCommand) {
    const phase = this.getById(workflow, id)
    const updatedCommands = phase.commands.map(command => {
      if (command.id === updatedCommand.id) return updatedCommand
      return command
    })
    return this.update(workflow, id, { commands: updatedCommands })
  }

  static removeCommand(workflow, id, commandId) {
    const phase = this.getById(workflow, id)
    const updatedCommands = phase.commands.filter(command => command.id !== commandId)
    return this.update(workflow, id, { commands: updatedCommands })
  }

  static getCommandByType(workflow, id, commandType) {
    const phase = this.getById(workflow, id)
    return phase.commands.find(command => command.type === commandType)
  }

  static updateSetTargetValueCommand(workflow, id, fctId, slotName, value) {
    const command = Phases
      .getCommandByType(workflow, id, Command.TYPES.SET_TARGETS)

    const existingTargetValue = command.data.targets
      .some(target => target.fctId === fctId && target.slotName === slotName)

    const updatedTargets = existingTargetValue
      ? command.data.targets.map(target => {
        if (target.fctId === fctId && target.slotName === slotName) {
          return { ...target, target: value }
        }
        return target
      })
      : [ ...command.data.targets, { fctId, slotName, target: value } ]

    const updatedCommand = {
      ...command,
      data: {
        ...command.data,
        targets: updatedTargets,
      },
    }

    return Phases.updateCommand(workflow, id, updatedCommand)
  }

  static setTargetValue(workflow, id, fctId, slotName, value) {
    const existingSetTargetCommand = Phases
      .getCommandByType(workflow, id, Command.TYPES.SET_TARGETS)

    if (!existingSetTargetCommand) {
      const command = {
        type: Command.TYPES.SET_TARGETS,
        data: { targets: [] },
      }
      return Phases.updateSetTargetValueCommand(
        Phases.addCommand(workflow, id, command),
        id,
        fctId,
        slotName,
        value,
      )
    }
    return Phases.updateSetTargetValueCommand(workflow, id, fctId, slotName, value)
  }

  static getTargetValue(workflow, id, fctId, slotName) {
    const existingSetTargetCommand = Phases
      .getCommandByType(workflow, id, Command.TYPES.SET_TARGETS)

    if (!existingSetTargetCommand) return

    const targetEntry = existingSetTargetCommand.data.targets.find(target => (
      target.fctId === fctId && target.slotName === slotName
    ))

    if (targetEntry) return targetEntry.target
  }

}

module.exports = Phases
