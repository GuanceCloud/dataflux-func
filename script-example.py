@DFF.API('Hello, world')
def hello_world(name=''):
    '''
    A hello world function

    Parameters:
    name {str} name

    return {str} "Hello, world! {name}"
    '''
    return f"Hello, world! {name}"

def test_hello_world():
    '''
    Test hello world function
    '''
    assert hello_world('Tom') == "Hello, world! Tom"
    return 'OK'
