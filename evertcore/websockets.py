from flask_socketio import emit, SocketIO
from dateutil.parser import parse

from . import data, plotting, plugins

socketio = SocketIO()

_threshold = 500


@socketio.on('connect', namespace='/test')
def joined():
    print('Socket connected')


@socketio.on('zoom_event', namespace='/test')
def zoom_event(socket_data):
    tmin = parse(socket_data['domain'][0])
    tmax = parse(socket_data['domain'][1])
    tags = socket_data['ids']

    tag_data_ = data.tag_data(tags, tmin, tmax)
    fig = plotting.Fig()
    fig.prepare_data(tag_data_, threshold=_threshold)
    data_ = fig.return_data()
    emit('zoom_return', dict(success=True, data=data_))

    return


@socketio.on('update_plugins_event', namespace='/test')
def update_plugin_data(socket_data):
    tmin = parse(socket_data['domain'][0])
    tmax = parse(socket_data['domain'][1])
    tags = socket_data['ids']

    tag_data_ = data.tag_data(tags, tmin, tmax)
    fig = plotting.Fig()
    fig.prepare_data(tag_data_, threshold=_threshold)
    data_ = fig.window_data(socket_data['domain'])
    plugins.emit_event('zoom_event', data_, fig.domain, socket_data['axisMap'])
    return


@socketio.on('add_on_event', namespace='/test')
def addon_event(socket_data):
    tags = socket_data['ids']
    name = socket_data['name']
    tmin = parse(socket_data['domain'][0])
    tmax = parse(socket_data['domain'][1])

    tag_data_ = data.tag_data(tags, tmin, tmax)
    plugins.emit_event('add_on_event', tag_data_, name)
    emit('add_on_return', dict(msg='addon return data'))
    return

